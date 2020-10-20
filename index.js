const fetch = require('node-fetch');
const http = require('http');
const url = require('url');

http.createServer(onRequest).listen(process.env.PORT || 8080);

function onRequest(request, response) {

    const url_parts = url.parse(request.url, true);
    const query = url_parts.query;

    const differenceDistance = 50000;

    if(
        !query
        || !query.player
    ) {
        response.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});
        response.write('Não foi passado o Nome do usuário');
        response.end();

        return;
    }
    
    (async () => {
        try {
        const responseData = await fetch(`https://map.rpdosstreamers.com.br/api/players`);
        const data = await responseData.json();

        if(!data.metadata.onlinePlayers) {
            response.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});
            response.write(`O sistema do mapa está fora do ar, tente novamente mais tarde!`);
            response.end();

            return;
        }

        const onlinePlayers = data.players.filter(item => {
            return item.status !== 'offline';
        });

        const filteredPlayer = onlinePlayers.filter(item => {
            return item.player.name === query.player;
        }).shift();

        if(!filteredPlayer) {
            response.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});
            response.write(`O streamer não está online no servidor, portanto, não há ninguém próximo.`);
            response.end();

            return;
        }

        const proximityPlayers = onlinePlayers.filter(item => {
            
            const filteredPlayerLongitudeMax = parseInt(filteredPlayer.player.longitude) + differenceDistance;
            const filteredPlayerLongitudeMin = parseInt(filteredPlayer.player.longitude) - differenceDistance;

            const filteredPlayerLatitudeMax = parseInt(filteredPlayer.player.latitude) + differenceDistance;
            const filteredPlayerLatitudeMin = parseInt(filteredPlayer.player.latitude) - differenceDistance;

            return item.player.name !== query.player 
                && item.stream 
                && item.stream.channel
                && (parseInt(item.player.longitude) >= filteredPlayerLongitudeMin && (item.player.longitude) <= filteredPlayerLongitudeMax)
                && (parseInt(item.player.latitude) >= filteredPlayerLatitudeMin && (item.player.latitude) <= filteredPlayerLatitudeMax);

        });

        let liveMap = proximityPlayers.map(item => {

            return item.stream.channel.name;

        });



        if(!liveMap.length) {
            response.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});
            response.write(`Não há nenhum streamer próximo`);
            response.end();

            return;
        }

        liveMap = liveMap.join('/');
        
        response.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});
        response.write(`https://multitwitch.tv/${filteredPlayer.stream.channel.name}/${liveMap}`);
        response.end();
    } catch(err) { 
        console.log(err);
        response.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});
        response.write('error');
        response.end();
    }
    })();

    function distance(lat1, lon1, lat2, lon2, unit) {
        if ((lat1 == lat2) && (lon1 == lon2)) {
            return 0;
        }
        else {
            var radlat1 = Math.PI * lat1/180;
            var radlat2 = Math.PI * lat2/180;
            var theta = lon1-lon2;
            var radtheta = Math.PI * theta/180;
            var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
            if (dist > 1) {
                dist = 1;
            }
            dist = Math.acos(dist);
            dist = dist * 180/Math.PI;
            dist = dist * 60 * 1.1515;
            if (unit=="K") { dist = dist * 1.609344 }
            if (unit=="N") { dist = dist * 0.8684 }
            return dist;
        }
    }
}
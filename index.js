const fetch = require('node-fetch');
const http = require('http');
const url = require('url');

http.createServer(onRequest).listen(process.env.PORT || 8080);

function onRequest(request, response) {

    const url_parts = url.parse(request.url, true);
    const query = url_parts.query;

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
            const distancePlayer = distance(filteredPlayer.player.longitude, filteredPlayer.player.latitude, item.player.longitude, item.player.latitude);

            return item.stream.channel && distancePlayer <= 2500 && item.player.name !== query.player;
        });

        let liveMap = proximityPlayers.map(item => {

            return item.stream.channel.displayName;

        });

        if(!liveMap) {
            response.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});
            response.write(`Não há nenhum streamer próximo`);
            response.end();

            return;
        }

        liveMap = liveMap.join('/');
        
        response.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});
        response.write(`https://multitwitch.tv/${filteredPlayer}/${liveMap}`);
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
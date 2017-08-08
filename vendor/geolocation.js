// check for Geolocation support
if (navigator.geolocation)
{

    console.log('Geolocation is supported!');
}
else
{
    alert('Geolocation is not supported for this Browser/OS version yet.');
}

MAP_WIDTH   = 1000000;
MAP_HEIGHT  = 1000000;

function convert(lat, lon){
    var y = ((-1 * lat) + 90) * (MAP_HEIGHT / 180);
    var x = (lon + 180) * (MAP_WIDTH / 360);
    return {x:x,y:y};
}

window.onload = function()
{
    var startPos;
    var stores =
    [
        {
            lat: 19.4375921,
            lng: -99.2099433,
            title: 'Superama Los Morales'
        },
        {
            lat: 19.4477107,
            lng: -99.2171927,
            title: 'Sam\'s Club Toreo'
        }
    ];

    navigator.geolocation.getCurrentPosition(
        function(position)
        {
            startPos = position;
            document.getElementById('startLat').innerHTML = startPos.coords.latitude;
            document.getElementById('startLon').innerHTML = startPos.coords.longitude;

            var convStart   = convert(startPos.coords.latitude,startPos.coords.longitude);
            var conv        = convert(stores[0].lat,stores[0].lng);
            var dif         =
            {
                x: convStart.x - conv.x,
                y: convStart.y - conv.y
            }

            $('#superama').attr('position',dif.x+' 0.5 '+dif.y);

            var convSams    = convert(stores[1].lat,stores[1].lng);
            var difSams     =
            {
                x: convStart.x - convSams.x,
                y: convStart.y - convSams.y
            }

            $('#sams').attr('position',difSams.x+' 0.5 '+difSams.y);

            console.log(convStart,conv,convSams,dif,difSams)


        },
        function(error)
        {
            alert('Error occurred. Error code: ' + error.code);
            // error.code can be:
            //   0: unknown error
            //   1: permission denied
            //   2: position unavailable (error response from locaton provider)
            //   3: timed out
        });

    navigator.geolocation.watchPosition(
        function(position)
        {
            document.getElementById('currentLat').innerHTML = position.coords.latitude;
            document.getElementById('currentLon').innerHTML = position.coords.longitude;



            document.getElementById('distance').innerHTML       = calculateDistance(stores[0].lat, stores[0].lng,position.coords.latitude, position.coords.longitude);
            document.getElementById('distanceSams').innerHTML   = calculateDistance(stores[1].lat, stores[1].lng,position.coords.latitude, position.coords.longitude);
        });
};


function calculateDistance(lat1, lon1, lat2, lon2)
{
    var R = 6371 * 1000; // km
    var dLat = (lat2 - lat1).toRad();
    var dLon = (lon2 - lon1).toRad();
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d;
}

Number.prototype.toRad = function()
{
    return this * Math.PI / 180;
}

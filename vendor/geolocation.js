// check for Geolocation support
if (navigator.geolocation)
{

    console.log('Geolocation is supported!');
}
else
{
    alert('Geolocation is not supported for this Browser/OS version yet.');
}



// our current position
var worldAdjustRotation = null;
var ajusteRot = null;
var positionHng;
var defaultOrientation;
var positionCurrent = {
    lat: null,
    lng: null,
    hng: null
};

function adjustRotationScene()
{

    if(ajusteRot == null && positionCurrent.hng != null && positionCurrent.hng != 0)
    {
        console.log('adjustRotationScene');
        console.log('ajusteRot '+ajusteRot);
        console.log('positionCurrent ',positionCurrent);

        ajusteRot = 90 - positionCurrent.hng;
        $('.orientation').html('<p>AJUSTE ROT: '+ajusteRot+' </p>')

        console.log('Ajuste rotación: '+ajusteRot);
    }
}

function getBrowserOrientation() {
    var orientation;
    if (screen.orientation && screen.orientation.type) {
        orientation = screen.orientation.type;
    } else {
        orientation = screen.orientation ||
            screen.mozOrientation ||
            screen.msOrientation;
    }

    /*
     'portait-primary':      for (screen width < screen height, e.g. phone, phablet, small tablet)
     device is in 'normal' orientation
     for (screen width > screen height, e.g. large tablet, laptop)
     device has been turned 90deg clockwise from normal

     'portait-secondary':    for (screen width < screen height)
     device has been turned 180deg from normal
     for (screen width > screen height)
     device has been turned 90deg anti-clockwise (or 270deg clockwise) from normal

     'landscape-primary':    for (screen width < screen height)
     device has been turned 90deg clockwise from normal
     for (screen width > screen height)
     device is in 'normal' orientation

     'landscape-secondary':  for (screen width < screen height)
     device has been turned 90deg anti-clockwise (or 270deg clockwise) from normal
     for (screen width > screen height)
     device has been turned 180deg from normal
     */

    return orientation;
}

function onHeadingChange(event) {
    var heading = event.alpha;

    if (typeof event.webkitCompassHeading !== "undefined") {
        heading = event.webkitCompassHeading; //iOS non-standard
    }

    var orientation = getBrowserOrientation();

    if (typeof heading !== "undefined" && heading !== null)
    {
        // && typeof orientation !== "undefined") {
        // we have a browser that reports device heading and orientation

        // what adjustment we have to add to rotation to allow for current device orientation
        var adjustment = 0;
        if (defaultOrientation === "landscape") {
            adjustment -= 90;
        }

        if (typeof orientation !== "undefined") {
            var currentOrientation = orientation.split("-");

            if (defaultOrientation !== currentOrientation[0])
            {
                if (defaultOrientation === "landscape")
                {
                    adjustment -= 270;
                }
                else
                {
                    adjustment -= 90;
                }
            }

            if (currentOrientation[1] === "secondary")
            {
                adjustment -= 180;
            }
        }

        positionCurrent.hng = heading + adjustment;

        var phase = positionCurrent.hng < 0 ? 360 + positionCurrent.hng : positionCurrent.hng;
        //positionHng.textContent = (360 - phase | 0) + "°";

        console.log('positionCurrent.hng ',positionCurrent.hng);
        //console.log( (360 - phase | 0) + "°");


        setTimeout(function()
        {
            console.log('timeout');
            adjustRotationScene();
        },1000)



        $('.brujula').html(parseFloat(positionCurrent.hng).toFixed(2)+ "°")

        /*
        // apply rotation to compass rose
        if (typeof rose.style.transform !== "undefined") {
            rose.style.transform = "rotateZ(" + positionCurrent.hng + "deg)";
        } else if (typeof rose.style.webkitTransform !== "undefined") {
            rose.style.webkitTransform = "rotateZ(" + positionCurrent.hng + "deg)";
        }
        */
    }
    else
    {
        // device can't show heading

        positionHng  = "n/a";
        console.log('brujula no disponible');
    }
}

if (window.DeviceOrientationEvent) {


    if (screen.width > screen.height)
    {
        defaultOrientation = "landscape";
    }
    else
    {
        defaultOrientation = "portrait";
    }

    window.addEventListener("deviceorientation", onHeadingChange);

} else {
    alert("Sorry, your browser doesn't support Device Orientation");
}


MAP_WIDTH           = 100000;
MAP_HEIGHT          = 100000;
var store_current   = null;

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
            info:{
                title: 'Superama Los Morales',
                horario: 'horario',
                promo: 'promo',
                info: 'info',
                desc: 'desc',
                dist: 'dist',
                type: 'superama'
            }
        },
        {
            lat: 19.4477107,
            lng: -99.2171927,
            info:{
                title: 'Sam\'s Club Toreo',
                horario: 'horario',
                promo: 'promo',
                info: 'info',
                desc: 'desc',
                dist: 'dist',
                type: 'sams'
            }
        },
        {
            lat: 19.4373714,
            lng: -99.2056145,
            info:{
                title: 'Superama Polanco',
                horario: 'horario',
                promo: 'promo',
                info: 'info',
                desc: 'desc',
                dist: 'dist',
                type: 'superama'
            }
        },
        {
            lat: 19.2973321,
            lng: -99.1065446,
            info:{
                title: 'Walmart Pabellón Cuemanco',
                horario: 'horario',
                promo: 'promo',
                info: 'info',
                desc: 'desc',
                dist: 'dist',
                type: 'supercenter'
            }
        },
        {
            lat: 19.2989663,
            lng: -99.1059896,
            info:{
                title: 'Bodega Aurrera Hueso',
                horario: 'horario',
                promo: 'promo',
                info: 'info',
                desc: 'desc',
                dist: 'dist',
                type: 'ba'
            }
        },
        {
            lat: 19.2982219,
            lng: -99.1143161,
            info:{
                title: 'Audi Coapa',
                horario: 'horario',
                promo: 'promo',
                info: 'info',
                desc: 'desc',
                dist: 'dist',
                type: 'ba'
            }
        },
        {
            lat:19.2969037,
            lng: -99.1119386,
            info:{
                title: 'IIM',
                horario: 'horario',
                promo: 'promo',
                info: 'info',
                desc: 'desc',
                dist: 'dist',
                type: 'ba'
            }
        },

    ];

    $('.cerrar').click(function()
    {
        $('.info').hide();
    });

    $('.debug').click(function()
    {
        if($('#tripmeter').is(':visible'))
        {
            $('#tripmeter').hide();
        }
        else
        {
            $('#tripmeter').show();
        }
    });


    //ajuste inical mundo, mandar el norte arriba
    $('#pointers').attr('rotation','0 -90 0');

    //ajuste por la posicion inicial del teléfono con respecto al norte, prueba
   // $('#pointers').attr('rotation','0 146 0');



    navigator.geolocation.getCurrentPosition(
        function(position)
        {
            startPos = position;
            document.getElementById('startLat').innerHTML = startPos.coords.latitude;
            document.getElementById('startLon').innerHTML = startPos.coords.longitude;



            //console.log('startPos ', startPos);
            //console.log('camera '  , $('#camera').attr('position'));

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
            $('#sams').attr('show-info', JSON.stringify(stores[1].info));

            var convSup    = convert(stores[2].lat,stores[2].lng);
            var difSup     =
            {
                x: convStart.x - convSup.x,
                y: convStart.y - convSup.y
            }
            $('#supPol').attr('position',difSup.x+' 0.5 '+difSup.y);

            var offset = 10000;
            var difCoordenads = {
                x: (startPos.coords.latitude     - stores[0].lat)*offset,
                y: (startPos.coords.longitude    - stores[0].lng)*offset
            }

            $('#sams').attr('position',difCoordenads.x+' 0.5 '+difCoordenads.y);
            //console.log(dif,difCoordenads)

            generatePin(startPos)



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
            console.log('store_current ',store_current);
            document.getElementById('currentLat').innerHTML = position.coords.latitude;
            document.getElementById('currentLon').innerHTML = position.coords.longitude;

            $('.stores').html('');
            for(var s in stores)
            {
                $('.stores').append('<p>Distance to '+stores[s].info.title+':<br/> <span id="distance">'+calculateDistance(stores[s].lat, stores[s].lng,position.coords.latitude, position.coords.longitude)+'</span> m </p>')
            }

            if(store_current!=null)
            {
                $('.txt.dist').show();
                $('.txt.dist').html(this.calculateDistance(store_current.lat, store_current.lng,position.coords.latitude, position.coords.longitude)+'m');
            }




        });

    function generatePin(startPos)
    {
        var offset  = 5000;
        var scene   = document.getElementById('pointers');

        for(var s in stores)
        {

            var convStart   = convert(startPos.coords.latitude,startPos.coords.longitude);
            var conv        = convert(stores[s].lat,stores[s].lng);
            var difCoordenads =
            {
                x: convStart.x - conv.x,
                y: convStart.y - conv.y
            }


            difCoordenads =
            {
                x: (startPos.coords.latitude     - stores[s].lat)*offset,
                y: (startPos.coords.longitude    - stores[s].lng)*offset
            }
            //console.log(difCoordenads)

            var color = '#123123';
            if(stores[s].info.title == 'IIM')
            {
                color = '#ff0000';
            }

            if(stores[s].info.title == 'Audi Coapa')
            {
                color = '#00ff00';
            }

           // console.log('X:', startPos.coords.latitude, stores[s].lat , difCoordenads.x , stores[s].info.title);
            //console.log(' ');

            var box	= document.createElement('a-box');
            box.setAttribute("position"	, difCoordenads.x+' 0.5 '+difCoordenads.y);
            //box.setAttribute("position"	, difCoordenads.x+' 0.5 0');
            box.setAttribute("rotation"	, "0 45 0");
            box.setAttribute("show-info", JSON.stringify(stores[s]));
            box.setAttribute("color"    , color);
            //box.setAttribute("look-at"	, "[camera]");

            //console.log('position' , difCoordenads.x+' 0.5 '+difCoordenads.y)

            scene.appendChild(box);
        }


        var norte	= document.createElement('a-entity');
        norte.setAttribute("position"   , '-10 0 0');
        norte.setAttribute("text"       , 'width:10; color:black; value:Norte; align:center;');
        norte.setAttribute("look-at"	, "[camera]");
        scene.appendChild(norte);

        var sur	= document.createElement('a-entity');
        sur.setAttribute("position"     , '10 0 0');
        sur.setAttribute("text"         , 'width:10; color:black; value:Sur; align:center;');
        sur.setAttribute("look-at"	    , "[camera]");
        scene.appendChild(sur);

        var este	= document.createElement('a-entity');
        este.setAttribute("position"     , '0 0 -10');
        este.setAttribute("text"         , 'width:10; color:black; value:Este; align:center;');
        este.setAttribute("look-at"	    , "[camera]");
        scene.appendChild(este);

        var oeste	= document.createElement('a-entity');
        oeste.setAttribute("position"     , '0 0 10');
        oeste.setAttribute("text"         , 'width:10; color:black; value:Oeste; align:center;');
        oeste.setAttribute("look-at"	  , "[camera]");
        scene.appendChild(oeste);



    }
};


function calculateDistance(lat1, lon1, lat2, lon2)
{
    var R = 6371 * 1000; // m
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

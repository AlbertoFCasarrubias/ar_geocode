/* globals AFRAME */
if (typeof AFRAME === 'undefined') {
    throw new Error('Component attempted to register before AFRAME' +
        ' was available.');
}

/**
 * ShowInfo component for A-Frame.
 */
AFRAME.registerComponent('show-info', {
    schema: {
        default: ''
    },

    boundClickHandler: undefined,



    clickHandler: function hrefClickHandler()
    {
        var store   = JSON.parse(this.data);
        var info    = store.info;
        var img     = '';
        var rutaimg = 'assets/img/';

        console.log('INFO: ',info);

        $('.info .logo').html('');
        $('.info .datos').html('');

        switch(info.type)
        {
            case 'supercenter':
                img = '<img src="'+rutaimg+'walmart.png">';
            break;

            case 'ba':
                img = '<img src="'+rutaimg+'ba.png">';
            break;

            case 'superama':
                img = '<img src="'+rutaimg+'superama.png">';
            break;

            case 'sams':
                img = '<img src="'+rutaimg+'sams.png">';
            break;

            default:
                img = '<img src="'+rutaimg+'walmart.png">';
            break;
        }

        $('.info .logo').append(img);
        $('.info .datos').append('<span class="title">'+info.title+'</span>');
        $('.info .datos').append('<span class="txt">'+info.horario+'</span>');
        $('.info .datos').append('<span class="txt dist">Calculando...</span>');
        $('.info .datos').append('<span class="txt">'+info.promo+'</span>');
        $('.info .datos').append('<span class="txt">'+info.desc+'</span>');
        $('.info .datos').append('<span class="txt">'+info.info+'</span>');

        $('.info').show();
        $('.info').css('opacity',1);
        //$('.info').css('top',0);


        store_current = store;
        /*

        var position = this.el.getAttribute('position');
        position.x += 2;

        var scene = document.querySelector('a-scene');

        var plane	= document.createElement('a-plane');
        plane.setAttribute("position"	, position);
        plane.setAttribute("src"		, "#img_"+info.type);
        plane.setAttribute("transparent", "true");
        plane.setAttribute("width"		, "3");
        plane.setAttribute("height"		, "3");
        plane.setAttribute("look-at"	, "[camera]");

        var title	= document.createElement('a-entity');
        title.setAttribute("text"	    , "width: 20; align:left; color: black; value: "+info.title);
        title.setAttribute("position"	, "0 0 0");
        plane.appendChild(title);

        var horario	= document.createElement('a-entity');
        horario.setAttribute("text"	    , "width: 10; align:left; color: black; value: "+info.horario);
        horario.setAttribute("position"	, "0 0 0");
        plane.appendChild(horario);

        scene.appendChild(plane);

       */


    },

    /**
     * Called once when component is attached. Generally for initial setup.
     */
    init: function()
    {
        console.log('INIT*/*/*');
        this.boundClickHandler = this.clickHandler.bind(this);
        this.el.addEventListener('click', this.boundClickHandler);
    },

    /**
     * Called when a component is removed (e.g., via removeAttribute).
     * Generally undoes all modifications to the entity.
     */
    remove: function() {
        this.el.removeEventListener('click', this.boundClickHandler);
    }
});
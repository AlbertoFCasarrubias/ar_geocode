var patterns;
var THREEx = THREEx || {}

THREEx.ArBaseControls = function(object3d){
	this.id = THREEx.ArBaseControls.id++

	this.object3d = object3d
	this.object3d.matrixAutoUpdate = false;
	this.object3d.visible = false

	// Events to honor
	// this.dispatchEvent({ type: 'becameVisible' })
	// this.dispatchEvent({ type: 'markerVisible' })	// replace markerFound
	// this.dispatchEvent({ type: 'becameUnVisible' })
}

THREEx.ArBaseControls.id = 0

Object.assign( THREEx.ArBaseControls.prototype, THREE.EventDispatcher.prototype );

//////////////////////////////////////////////////////////////////////////////
//		Functions
//////////////////////////////////////////////////////////////////////////////
/**
 * error catching function for update()
 */
THREEx.ArBaseControls.prototype.update = function(){
	console.assert(false, 'you need to implement your own update')
}

/**
 * error catching function for name()
 */
THREEx.ArBaseControls.prototype.name = function(){
	console.assert(false, 'you need to implement your own .name()')
	return 'Not yet implemented - name()'
}
var THREEx = THREEx || {}

/**
 * - maybe support .onClickFcts in each object3d
 * - seems an easy light layer for clickable object
 * - up to
 */
THREEx.ARClickability = function(sourceElement){
	this._sourceElement = sourceElement
	// Create cameraPicking
	var fullWidth = parseInt(sourceElement.style.width)
	var fullHeight = parseInt(sourceElement.style.height)
	this._cameraPicking = new THREE.PerspectiveCamera(42, fullWidth / fullHeight, 0.1, 100);
}

THREEx.ARClickability.prototype.onResize = function(){
	var sourceElement = this._sourceElement
	var cameraPicking = this._cameraPicking

	var fullWidth = parseInt(sourceElement.style.width)
	var fullHeight = parseInt(sourceElement.style.height)
	cameraPicking.aspect = fullWidth / fullHeight;
	cameraPicking.updateProjectionMatrix();
}

THREEx.ARClickability.prototype.computeIntersects = function(domEvent, objects){
	var sourceElement = this._sourceElement
	var cameraPicking = this._cameraPicking

	// compute mouse coordinatge with [-1,1]
	var eventCoords = new THREE.Vector3();
	eventCoords.x =   ( domEvent.layerX / parseInt(sourceElement.style.width)  ) * 2 - 1;
	eventCoords.y = - ( domEvent.layerY / parseInt(sourceElement.style.height) ) * 2 + 1;

	// compute intersections between eventCoords and pickingPlane
	var raycaster = new THREE.Raycaster();
	raycaster.setFromCamera( eventCoords, cameraPicking );
	var intersects = raycaster.intersectObjects( objects )

	return intersects
}

THREEx.ARClickability.prototype.update = function(){

}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

THREEx.ARClickability.tangoPickingPointCloud = function(artoolkitContext, mouseX, mouseY){
	var vrDisplay = artoolkitContext._tangoContext.vrDisplay
	if (vrDisplay === null ) return
	var pointAndPlane = vrDisplay.getPickingPointAndPlaneInPointCloud(mouseX, mouseY)
	if( pointAndPlane == null ) {
		console.warn('Could not retrieve the correct point and plane.')
		return null
	}

	// FIXME not sure what this is
	var boundingSphereRadius = 0.01

	// the bigger the number the likeliest it crash chromium-webar

	// Orient and position the model in the picking point according
	// to the picking plane. The offset is half of the model size.
	var object3d = new THREE.Object3D
	THREE.WebAR.positionAndRotateObject3DWithPickingPointAndPlaneInPointCloud(
		pointAndPlane, object3d, boundingSphereRadius
	)
	object3d.rotateZ(-Math.PI/2)

	// return the result
	var result = {}
	result.position = object3d.position
	result.quaternion = object3d.quaternion
	return result
}
var THREEx = THREEx || {}
/**
 * - videoTexture
 * - cloakWidth
 * - cloakHeight
 * - cloakSegmentsHeight
 * - remove all mentions of cache, for cloak
 */
THREEx.ArMarkerCloak = function(videoTexture){
	var updateInShaderEnabled = true

	// build cloakMesh
	// TODO if webgl2 use repeat warp, and not multi segment, this will reduce the geometry to draw
	var geometry = new THREE.PlaneGeometry(1.3+0.25,1.85+0.25, 1, 8).translate(0,-0.3,0)
	var material = new THREE.ShaderMaterial( {
		vertexShader: THREEx.ArMarkerCloak.vertexShader,
		fragmentShader: THREEx.ArMarkerCloak.fragmentShader,
		transparent: true,
		uniforms: {
			texture: {
				value: videoTexture
			},
			opacity: {
				value: 0.5
			}
		},
		defines: {
			updateInShaderEnabled: updateInShaderEnabled ? 1 : 0,
		}
	});

	var cloakMesh = new THREE.Mesh( geometry, material );
	cloakMesh.rotation.x = -Math.PI/2
	this.object3d = cloakMesh

	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////

	var xMin = -0.65
	var xMax =  0.65
	var yMin =  0.65 + 0.1
	var yMax =  0.95 + 0.1

	//////////////////////////////////////////////////////////////////////////////
	//		originalsFaceVertexUvs
	//////////////////////////////////////////////////////////////////////////////
	var originalsFaceVertexUvs = [[]]

	// build originalsFaceVertexUvs array
	for(var faceIndex = 0; faceIndex < cloakMesh.geometry.faces.length; faceIndex ++ ){
		originalsFaceVertexUvs[0][faceIndex] = []
		originalsFaceVertexUvs[0][faceIndex][0] = new THREE.Vector2()
		originalsFaceVertexUvs[0][faceIndex][1] = new THREE.Vector2()
		originalsFaceVertexUvs[0][faceIndex][2] = new THREE.Vector2()
	}

	// set values in originalsFaceVertexUvs
	for(var i = 0; i < cloakMesh.geometry.parameters.heightSegments/2; i ++ ){
		// one segment height - even row - normale orientation
		originalsFaceVertexUvs[0][i*4+0][0].set( xMin/2+0.5, yMax/2+0.5 )
		originalsFaceVertexUvs[0][i*4+0][1].set( xMin/2+0.5, yMin/2+0.5 )
		originalsFaceVertexUvs[0][i*4+0][2].set( xMax/2+0.5, yMax/2+0.5 )

		originalsFaceVertexUvs[0][i*4+1][0].set( xMin/2+0.5, yMin/2+0.5 )
		originalsFaceVertexUvs[0][i*4+1][1].set( xMax/2+0.5, yMin/2+0.5 )
		originalsFaceVertexUvs[0][i*4+1][2].set( xMax/2+0.5, yMax/2+0.5 )

		// one segment height - odd row - mirror-y orientation
		originalsFaceVertexUvs[0][i*4+2][0].set( xMin/2+0.5, yMin/2+0.5 )
		originalsFaceVertexUvs[0][i*4+2][1].set( xMin/2+0.5, yMax/2+0.5 )
		originalsFaceVertexUvs[0][i*4+2][2].set( xMax/2+0.5, yMin/2+0.5 )

		originalsFaceVertexUvs[0][i*4+3][0].set( xMin/2+0.5, yMax/2+0.5 )
		originalsFaceVertexUvs[0][i*4+3][1].set( xMax/2+0.5, yMax/2+0.5 )
		originalsFaceVertexUvs[0][i*4+3][2].set( xMax/2+0.5, yMin/2+0.5 )
	}

	if( updateInShaderEnabled === true ){
		cloakMesh.geometry.faceVertexUvs = originalsFaceVertexUvs
		cloakMesh.geometry.uvsNeedUpdate = true
	}

	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////

	var originalOrthoVertices = []
	originalOrthoVertices.push( new THREE.Vector3(xMin, yMax, 0))
	originalOrthoVertices.push( new THREE.Vector3(xMax, yMax, 0))
	originalOrthoVertices.push( new THREE.Vector3(xMin, yMin, 0))
	originalOrthoVertices.push( new THREE.Vector3(xMax, yMin, 0))

	// build debugMesh
	var material = new THREE.MeshNormalMaterial({
		transparent : true,
		opacity: 0.5,
		side: THREE.DoubleSide
	});
	var geometry = new THREE.PlaneGeometry(1,1);
	var orthoMesh = new THREE.Mesh(geometry, material);
	this.orthoMesh = orthoMesh

	//////////////////////////////////////////////////////////////////////////////
	//                Code Separator
	//////////////////////////////////////////////////////////////////////////////

	this.update = function(modelViewMatrix, cameraProjectionMatrix){
		updateOrtho(modelViewMatrix, cameraProjectionMatrix)

		if( updateInShaderEnabled === false ){
			updateUvs(modelViewMatrix, cameraProjectionMatrix)
		}
	}

	return

	// update cloakMesh
	function updateUvs(modelViewMatrix, cameraProjectionMatrix){
		var transformedUv = new THREE.Vector3()
		originalsFaceVertexUvs[0].forEach(function(faceVertexUvs, faceIndex){
			faceVertexUvs.forEach(function(originalUv, uvIndex){
				// set transformedUv - from UV coord to clip coord
				transformedUv.x = originalUv.x * 2.0 - 1.0;
				transformedUv.y = originalUv.y * 2.0 - 1.0;
				transformedUv.z = 0
				// apply modelViewMatrix and projectionMatrix
				transformedUv.applyMatrix4( modelViewMatrix )
				transformedUv.applyMatrix4( cameraProjectionMatrix )
				// apply perspective
				transformedUv.x /= transformedUv.z
				transformedUv.y /= transformedUv.z
				// set back from clip coord to Uv coord
				transformedUv.x = transformedUv.x / 2.0 + 0.5;
				transformedUv.y = transformedUv.y / 2.0 + 0.5;
				// copy the trasnformedUv into the geometry
				cloakMesh.geometry.faceVertexUvs[0][faceIndex][uvIndex].set(transformedUv.x, transformedUv.y)
			})
		})

		// cloakMesh.geometry.faceVertexUvs = faceVertexUvs
		cloakMesh.geometry.uvsNeedUpdate = true
	}

	// update orthoMesh
	function updateOrtho(modelViewMatrix, cameraProjectionMatrix){
		// compute transformedUvs
		var transformedUvs = []
		originalOrthoVertices.forEach(function(originalOrthoVertices, index){
			var transformedUv = originalOrthoVertices.clone()
			// apply modelViewMatrix and projectionMatrix
			transformedUv.applyMatrix4( modelViewMatrix )
			transformedUv.applyMatrix4( cameraProjectionMatrix )
			// apply perspective
			transformedUv.x /= transformedUv.z
			transformedUv.y /= transformedUv.z
			// store it
			transformedUvs.push(transformedUv)
		})

		// change orthoMesh vertices
		for(var i = 0; i < transformedUvs.length; i++){
			orthoMesh.geometry.vertices[i].copy(transformedUvs[i])
		}
		orthoMesh.geometry.computeBoundingSphere()
		orthoMesh.geometry.verticesNeedUpdate = true
	}

}

//////////////////////////////////////////////////////////////////////////////
//                Shaders
//////////////////////////////////////////////////////////////////////////////

THREEx.ArMarkerCloak.markerSpaceShaderFunction = '\n'+
	'        vec2 transformUvToMarkerSpace(vec2 originalUv){\n'+
	'                vec3 transformedUv;\n'+
	'                // set transformedUv - from UV coord to clip coord\n'+
	'                transformedUv.x = originalUv.x * 2.0 - 1.0;\n'+
	'                transformedUv.y = originalUv.y * 2.0 - 1.0;\n'+
	'                transformedUv.z = 0.0;\n'+
	'\n'+
	'		// apply modelViewMatrix and projectionMatrix\n'+
	'                transformedUv = (projectionMatrix * modelViewMatrix * vec4( transformedUv, 1.0 ) ).xyz;\n'+
	'\n'+
	'		// apply perspective\n'+
	'		transformedUv.x /= transformedUv.z;\n'+
	'		transformedUv.y /= transformedUv.z;\n'+
	'\n'+
	'                // set back from clip coord to Uv coord\n'+
	'                transformedUv.x = transformedUv.x / 2.0 + 0.5;\n'+
	'                transformedUv.y = transformedUv.y / 2.0 + 0.5;\n'+
	'\n'+
	'                // return the result\n'+
	'                return transformedUv.xy;\n'+
	'        }'

THREEx.ArMarkerCloak.vertexShader = THREEx.ArMarkerCloak.markerSpaceShaderFunction +
	'	varying vec2 vUv;\n'+
	'\n'+
	'	void main(){\n'+
	'                // pass the UV to the fragment\n'+
	'                #if (updateInShaderEnabled == 1)\n'+
	'		        vUv = transformUvToMarkerSpace(uv);\n'+
	'                #else\n'+
	'		        vUv = uv;\n'+
	'                #endif\n'+
	'\n'+
	'                // compute gl_Position\n'+
	'		vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );\n'+
	'		gl_Position = projectionMatrix * mvPosition;\n'+
	'	}';

THREEx.ArMarkerCloak.fragmentShader = '\n'+
	'	varying vec2 vUv;\n'+
	'	uniform sampler2D texture;\n'+
	'	uniform float opacity;\n'+
	'\n'+
	'	void main(void){\n'+
	'		vec3 color = texture2D( texture, vUv ).rgb;\n'+
	'\n'+
	'		gl_FragColor = vec4( color, opacity);\n'+
	'	}'
var THREEx = THREEx || {}

THREEx.ArMarkerControls = function(context, object3d, parameters){
	var _this = this

	THREEx.ArBaseControls.call(this, object3d)

	this.context = context
	// handle default parameters
	this.parameters = {
		// size of the marker in meter
		size : parameters.size !== undefined ? parameters.size : 1,
		// type of marker - ['pattern', 'barcode', 'unknown' ]
		type : parameters.type !== undefined ? parameters.type : 'unknown',
		// url of the pattern - IIF type='pattern'
		patternUrl : parameters.patternUrl !== undefined ? parameters.patternUrl : null,
		// value of the barcode - IIF type='barcode'
		barcodeValue : parameters.barcodeValue !== undefined ? parameters.barcodeValue : null,
		// change matrix mode - [modelViewMatrix, cameraTransformMatrix]
		changeMatrixMode : parameters.changeMatrixMode !== undefined ? parameters.changeMatrixMode : 'modelViewMatrix',
		// minimal confidence in the marke recognition - between [0, 1] - default to 1
		minConfidence: parameters.minConfidence !== undefined ? parameters.minConfidence : 0.6,
	}

	// sanity check
	var possibleValues = ['pattern', 'barcode', 'unknown']
	console.assert(possibleValues.indexOf(this.parameters.type) !== -1, 'illegal value', this.parameters.type)
	var possibleValues = ['modelViewMatrix', 'cameraTransformMatrix' ]
	console.assert(possibleValues.indexOf(this.parameters.changeMatrixMode) !== -1, 'illegal value', this.parameters.changeMatrixMode)


	// create the marker Root
	this.object3d = object3d
	this.object3d.matrixAutoUpdate = false;
	this.object3d.visible = false

	// add this marker to artoolkitsystem
	// TODO rename that .addMarkerControls
	context.addMarker(this)

	if( _this.context.parameters.trackingBackend === 'artoolkit' ){
		this._initArtoolkit()
	}else if( _this.context.parameters.trackingBackend === 'aruco' ){
		// TODO create a ._initAruco
		// put aruco second
		this._arucoPosit = new POS.Posit(this.parameters.size, _this.context.arucoContext.canvas.width)
	}else if( _this.context.parameters.trackingBackend === 'tango' ){
		this._initTango()
	}else console.assert(false)
}

THREEx.ArMarkerControls.prototype = Object.create( THREEx.ArBaseControls.prototype );
THREEx.ArMarkerControls.prototype.constructor = THREEx.ArMarkerControls;

THREEx.ArMarkerControls.prototype.dispose = function(){
	this.context.removeMarker(this)

	// TODO remove the event listener if needed
	// unloadMaker ???
}

//////////////////////////////////////////////////////////////////////////////
//		update controls with new modelViewMatrix
//////////////////////////////////////////////////////////////////////////////

/**
 * When you actually got a new modelViewMatrix, you need to perfom a whole bunch
 * of things. it is done here.
 */
THREEx.ArMarkerControls.prototype.updateWithModelViewMatrix = function(modelViewMatrix){
	var markerObject3D = this.object3d;

	// mark object as visible
	markerObject3D.visible = true

	if( this.context.parameters.trackingBackend === 'artoolkit' ){
		// apply context._axisTransformMatrix - change artoolkit axis to match usual webgl one
		var tmpMatrix = new THREE.Matrix4().copy(this.context._artoolkitProjectionAxisTransformMatrix)
		tmpMatrix.multiply(modelViewMatrix)

		modelViewMatrix.copy(tmpMatrix)
	}else if( this.context.parameters.trackingBackend === 'aruco' ){
		// ...
	}else if( this.context.parameters.trackingBackend === 'tango' ){
		// ...
	}else console.assert(false)


	if( this.context.parameters.trackingBackend !== 'tango' ){

		// change axis orientation on marker - artoolkit say Z is normal to the marker - ar.js say Y is normal to the marker
		var markerAxisTransformMatrix = new THREE.Matrix4().makeRotationX(Math.PI/2)
		modelViewMatrix.multiply(markerAxisTransformMatrix)
	}

	// change markerObject3D.matrix based on parameters.changeMatrixMode
	if( this.parameters.changeMatrixMode === 'modelViewMatrix' ){
		markerObject3D.matrix.copy(modelViewMatrix)
	}else if( this.parameters.changeMatrixMode === 'cameraTransformMatrix' ){
		markerObject3D.matrix.getInverse( modelViewMatrix )
	}else {
		console.assert(false)
	}

	// decompose - the matrix into .position, .quaternion, .scale
	markerObject3D.matrix.decompose(markerObject3D.position, markerObject3D.quaternion, markerObject3D.scale)

	// dispatchEvent
	this.dispatchEvent( { type: 'markerFound' } );
}

//////////////////////////////////////////////////////////////////////////////
//		utility functions
//////////////////////////////////////////////////////////////////////////////

/**
 * provide a name for a marker
 * - silly heuristic for now
 * - should be improved
 */
THREEx.ArMarkerControls.prototype.name = function(){
	var name = ''
	name += this.parameters.type;
	if( this.parameters.type === 'pattern' ){
		var url = this.parameters.patternUrl
		var basename = url.replace(/^.*\//g, '')
		name += ' - ' + basename
	}else if( this.parameters.type === 'barcode' ){
		name += ' - ' + this.parameters.barcodeValue
	}else{
		console.assert(false, 'no .name() implemented for this marker controls')
	}
	return name
}

//////////////////////////////////////////////////////////////////////////////
//		init for Artoolkit
//////////////////////////////////////////////////////////////////////////////
THREEx.ArMarkerControls.prototype._initArtoolkit = function(){
	//console.log('inicio')

	var _this = this

	var artoolkitMarkerId = null

	var delayedInitTimerId = setInterval(function(){
		// check if arController is init
		var arController = _this.context.arController
		if( arController === null )	return
		// stop looping if it is init
		clearInterval(delayedInitTimerId)
		delayedInitTimerId = null
		// launch the _postInitArtoolkit
		postInit()
	}, 1000/50)

	return

	function postInit(){
		// check if arController is init
		var arController = _this.context.arController
		console.assert(arController !== null )

		// start tracking this pattern
		if( _this.parameters.type === 'pattern' ){
			arController.loadMarker(_this.parameters.patternUrl, function(markerId) {
				artoolkitMarkerId = markerId
				arController.trackPatternMarkerId(artoolkitMarkerId, _this.parameters.size);
			});
		}else if( _this.parameters.type === 'barcode' ){
			artoolkitMarkerId = _this.parameters.barcodeValue
			arController.trackBarcodeMarkerId(artoolkitMarkerId, _this.parameters.size);
		}else if( _this.parameters.type === 'unknown' ){
			artoolkitMarkerId = null
		}else{
			console.log(false, 'invalid marker type', _this.parameters.type)
		}

		// listen to the event
		arController.addEventListener('getMarker', function(event){
			if( event.data.type === artoolkit.PATTERN_MARKER && _this.parameters.type === 'pattern' ){
				if( artoolkitMarkerId === null )	return
				if( event.data.marker.idPatt === artoolkitMarkerId ) onMarkerFound(event)
			}else if( event.data.type === artoolkit.BARCODE_MARKER && _this.parameters.type === 'barcode' ){
				// console.log('BARCODE_MARKER idMatrix', event.data.marker.idMatrix, artoolkitMarkerId )
				if( artoolkitMarkerId === null )	return
				if( event.data.marker.idMatrix === artoolkitMarkerId )  onMarkerFound(event)
			}else if( event.data.type === artoolkit.UNKNOWN_MARKER && _this.parameters.type === 'unknown'){
				onMarkerFound(event)
			}
		})

	}

	function onMarkerFound(event){
		// honor his.parameters.minConfidence
		if( event.data.type === artoolkit.PATTERN_MARKER && event.data.marker.cfPatt < _this.parameters.minConfidence )	return
		if( event.data.type === artoolkit.BARCODE_MARKER && event.data.marker.cfMatt < _this.parameters.minConfidence )	return

		var modelViewMatrix = new THREE.Matrix4().fromArray(event.data.matrix)
		_this.updateWithModelViewMatrix(modelViewMatrix)
	}
}

//////////////////////////////////////////////////////////////////////////////
//		aruco specific
//////////////////////////////////////////////////////////////////////////////
THREEx.ArMarkerControls.prototype._initAruco = function(){
	this._arucoPosit = new POS.Posit(this.parameters.size, _this.context.arucoContext.canvas.width)
}

//////////////////////////////////////////////////////////////////////////////
//		init for Artoolkit
//////////////////////////////////////////////////////////////////////////////
THREEx.ArMarkerControls.prototype._initTango = function(){
	var _this = this
	console.log('init tango ArMarkerControls')
}
var THREEx = THREEx || {}

THREEx.ArMarkerHelper = function(markerControls){
	this.object3d = new THREE.Group

	var mesh = new THREE.AxisHelper()
	this.object3d.add(mesh)

	var text = markerControls.id
	// debugger
	// var text = markerControls.parameters.patternUrl.slice(-1).toUpperCase();

	var canvas = document.createElement( 'canvas' );
	canvas.width =  64;
	canvas.height = 64;

	var context = canvas.getContext( '2d' );
	var texture = new THREE.CanvasTexture( canvas );

	// put the text in the sprite
	context.font = '48px monospace';
	context.fillStyle = 'rgba(192,192,255, 0.5)';
	context.fillRect( 0, 0, canvas.width, canvas.height );
	context.fillStyle = 'darkblue';
	context.fillText(text, canvas.width/4, 3*canvas.height/4 )
	texture.needsUpdate = true

	// var geometry = new THREE.CubeGeometry(1, 1, 1)
	var geometry = new THREE.PlaneGeometry(1, 1)
	var material = new THREE.MeshBasicMaterial({
		map: texture,
		transparent: true
	});
	var mesh = new THREE.Mesh(geometry, material)
	mesh.rotation.x = -Math.PI/2

	this.object3d.add(mesh)

}
var THREEx = THREEx || {}

/**
 * - lerp position/quaternino/scale
 * - minDelayDetected
 * - minDelayUndetected
 * @param {[type]} object3d   [description]
 * @param {[type]} parameters [description]
 */
THREEx.ArSmoothedControls = function(object3d, parameters){
	var _this = this

	THREEx.ArBaseControls.call(this, object3d)

	// copy parameters
	this.object3d.visible = false

	this._lastLerpStepAt = null
	this._visibleStartedAt = null
	this._unvisibleStartedAt = null

	// handle default parameters
	parameters = parameters || {}
	this.parameters = {
		// lerp coeficient for the position - between [0,1] - default to 1
		lerpPosition: parameters.lerpPosition !== undefined ? parameters.lerpPosition : 0.8,
		// lerp coeficient for the quaternion - between [0,1] - default to 1
		lerpQuaternion: parameters.lerpQuaternion !== undefined ? parameters.lerpQuaternion : 0.2,
		// lerp coeficient for the scale - between [0,1] - default to 1
		lerpScale: parameters.lerpScale !== undefined ? parameters.lerpScale : 0.7,
		// delay for lerp fixed steps - in seconds - default to 1/120
		lerpStepDelay: parameters.fixStepDelay !== undefined ? parameters.fixStepDelay : 1/60,
		// minimum delay the sub-control must be visible before this controls become visible - default to 0 seconds
		minVisibleDelay: parameters.minVisibleDelay !== undefined ? parameters.minVisibleDelay : 0.0,
		// minimum delay the sub-control must be unvisible before this controls become unvisible - default to 0 seconds
		minUnvisibleDelay: parameters.minUnvisibleDelay !== undefined ? parameters.minUnvisibleDelay : 0.2,
	}
}

THREEx.ArSmoothedControls.prototype = Object.create( THREEx.ArBaseControls.prototype );
THREEx.ArSmoothedControls.prototype.constructor = THREEx.ArSmoothedControls;

//////////////////////////////////////////////////////////////////////////////
//		update function
//////////////////////////////////////////////////////////////////////////////

THREEx.ArSmoothedControls.prototype.update = function(targetObject3d){
	var object3d = this.object3d
	var parameters = this.parameters
	var wasVisible = object3d.visible
	var present = performance.now()/1000


	//////////////////////////////////////////////////////////////////////////////
	//		handle object3d.visible with minVisibleDelay/minUnvisibleDelay
	//////////////////////////////////////////////////////////////////////////////
	if( targetObject3d.visible === false )	this._visibleStartedAt = null
	if( targetObject3d.visible === true )	this._unvisibleStartedAt = null

	if( targetObject3d.visible === true && this._visibleStartedAt === null )	this._visibleStartedAt = present
	if( targetObject3d.visible === false && this._unvisibleStartedAt === null )	this._unvisibleStartedAt = present

	if( wasVisible === false && targetObject3d.visible === true ){
		var visibleFor = present - this._visibleStartedAt
		if( visibleFor >= this.parameters.minVisibleDelay ){
			object3d.visible = true
			snapDirectlyToTarget()
		}
		// console.log('visibleFor', visibleFor)
	}

	if( wasVisible === true && targetObject3d.visible === false ){
		var unvisibleFor = present - this._unvisibleStartedAt
		if( unvisibleFor >= this.parameters.minUnvisibleDelay ){
			object3d.visible = false
		}
	}

	//////////////////////////////////////////////////////////////////////////////
	//		apply lerp on positon/quaternion/scale
	//////////////////////////////////////////////////////////////////////////////

	// apply lerp steps - require fix time steps to behave the same no matter the fps
	if( this._lastLerpStepAt === null ){
		applyOneSlerpStep()
		this._lastLerpStepAt = present
	}else{
		var nStepsToDo = Math.floor( (present - this._lastLerpStepAt)/this.parameters.lerpStepDelay )
		for(var i = 0; i < nStepsToDo; i++){
			applyOneSlerpStep()
			this._lastLerpStepAt += this.parameters.lerpStepDelay
		}
	}

	// disable the lerp by directly copying targetObject3d position/quaternion/scale
	if( false ){
		snapDirectlyToTarget()
	}

	// update the matrix
	this.object3d.updateMatrix()

	//////////////////////////////////////////////////////////////////////////////
	//		honor becameVisible/becameUnVisible event
	//////////////////////////////////////////////////////////////////////////////
	// honor becameVisible event
	if( wasVisible === false && object3d.visible === true ){
		this.dispatchEvent({ type: 'becameVisible' })
	}
	// honor becameUnVisible event
	if( wasVisible === true && object3d.visible === false ){
		this.dispatchEvent({ type: 'becameUnVisible' })
	}
	return

	function snapDirectlyToTarget(){
		object3d.position.copy( targetObject3d.position )
		object3d.quaternion.copy( targetObject3d.quaternion )
		object3d.scale.copy( targetObject3d.scale )
	}

	function applyOneSlerpStep(){
		object3d.position.lerp(targetObject3d.position, parameters.lerpPosition)
		object3d.quaternion.slerp(targetObject3d.quaternion, parameters.lerpQuaternion)
		object3d.scale.lerp(targetObject3d.scale, parameters.lerpScale)
	}
}
var THREEx = THREEx || {}

THREEx.ArToolkitContext = function(parameters){
	//console.log('INICIO?');

	var _this = this

	_this._updatedAt = null

	// handle default parameters
	this.parameters = {
		// AR backend - ['artoolkit', 'aruco', 'tango']
		trackingBackend: parameters.trackingBackend !== undefined ? parameters.trackingBackend : 'artoolkit',
		// debug - true if one should display artoolkit debug canvas, false otherwise
		debug: parameters.debug !== undefined ? parameters.debug : false,
		// the mode of detection - ['color', 'color_and_matrix', 'mono', 'mono_and_matrix']
		detectionMode: parameters.detectionMode !== undefined ? parameters.detectionMode : 'mono',
		// type of matrix code - valid iif detectionMode end with 'matrix' - [3x3, 3x3_HAMMING63, 3x3_PARITY65, 4x4, 4x4_BCH_13_9_3, 4x4_BCH_13_5_5]
		matrixCodeType: parameters.matrixCodeType !== undefined ? parameters.matrixCodeType : '3x3',

		// url of the camera parameters
		cameraParametersUrl: parameters.cameraParametersUrl !== undefined ? parameters.cameraParametersUrl : THREEx.ArToolkitContext.baseURL + 'parameters/camera_para.dat',

		// tune the maximum rate of pose detection in the source image
		maxDetectionRate: parameters.maxDetectionRate !== undefined ? parameters.maxDetectionRate : 60,
		// resolution of at which we detect pose in the source image
		canvasWidth: parameters.canvasWidth !== undefined ? parameters.canvasWidth : 640,
		canvasHeight: parameters.canvasHeight !== undefined ? parameters.canvasHeight : 480,

		// enable image smoothing or not for canvas copy - default to true
		// https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingEnabled
		imageSmoothingEnabled : parameters.imageSmoothingEnabled !== undefined ? parameters.imageSmoothingEnabled : false,
	}
	// parameters sanity check
	//console.log(['artoolkit', 'aruco', 'tango'].indexOf(this.parameters.trackingBackend) !== -1, 'invalid parameter trackingBackend', this.parameters.trackingBackend)
	//console.log(['color', 'color_and_matrix', 'mono', 'mono_and_matrix'].indexOf(this.parameters.detectionMode) !== -1, 'invalid parameter detectionMode', this.parameters.detectionMode)

	this.arController = null;
	this.arucoContext = null;

	this._arMarkersControls = []
}

function generateBox(obj)
{
	var object 	= document.createElement(obj.type);
	object.setAttribute("position"	, obj.position);
	object.setAttribute("material"	, obj.material);
	object.setAttribute("href"		, obj.url);
	object.setAttribute("target"	, obj.target);

	return object;
}

function addAsset(obj)
{
	var assets = document.getElementById("assets");

	if(assets!=null)
	{
		//assets.appendChild(obj);
		$('a-assets').append(obj);
	}
	else
	{
		$('a-assets').append(obj);
	}


}

function generateImage(obj)
{
	var id = Date.now();
	//<img id="my-image" src="images/test.jpg">
	var img 	= document.createElement('img');
	img.setAttribute("id"	, id);
	img.setAttribute("src"	, obj.srcImg);
	addAsset(img);

	var object 	= document.createElement(obj.type);
	//object.setAttribute("position"	, obj.position);
	//object.setAttribute("material"	, obj.material);
	object.setAttribute("src"		, "#"+id);
	object.setAttribute("href"		, obj.url);
	object.setAttribute("target"	, obj.target);

	return object;
}

function generatePlane(obj)
{
	var id 	= Date.now();
	var img	= document.createElement('img');
	img.setAttribute("id"	, id);
	img.setAttribute("src"	, obj.srcImg);
	addAsset(img);

	var object 	= document.createElement(obj.type);
	object.setAttribute("rotation"	, obj.rotation);
	object.setAttribute("width"		, obj.width);
	object.setAttribute("height"	, obj.height);
	object.setAttribute("src"		, "#"+id);
	//object.setAttribute("href"		, obj.url);
	//object.setAttribute("target"	, obj.target);

	var button = generateButton(obj, parseFloat(obj.width) +.5);

	return [object].concat(button);

	//return object;
}

function generateModel(obj)
{
	//<a-entity obj-model="obj: #myModelObj; mtl: #myModelMtl" scale="0.1 0.1 0.1" href="#" target="_blank#rotation">
	//"obj"     : "models/knight.obj",
	//"mtl"     : "models/knight.mtl",
	//<a-animation id="boxout" attribute="rotation" from="0 0 0" to="0 -180 0" begin="href" dur="800" easing="ease-in-back"></a-animation>

	var idObj 	= 'obj'+Date.now();
	var idMtl 	= 'mlt'+Date.now();
	var ob		= document.createElement('a-asset-item');
	ob.setAttribute("id"	, idObj);
	ob.setAttribute("src"	, obj.obj);
	addAsset(ob);

	var mtl	= document.createElement('a-asset-item');
	mtl.setAttribute("id"	, idMtl);
	mtl.setAttribute("src"	, obj.mtl);
	addAsset(mtl);

	var object 	= document.createElement(obj.type);
	object.setAttribute("obj-model"	, "obj: #"+idObj+"; mtl: #"+idMtl);
	object.setAttribute("scale"		, obj.scale);
	//object.setAttribute("href"		, obj.url);
	//object.setAttribute("target"	, obj.target+"#anim");

	var animation 	= document.createElement("a-animation");
	animation.setAttribute("id"			, "anim");
	animation.setAttribute("attribute"	, "rotation");
	animation.setAttribute("from"		, "0 0 0");
	animation.setAttribute("to"			, "0 -180 0");
	animation.setAttribute("begin"		, "href");
	animation.setAttribute("dur"		, "800");
	animation.setAttribute("easing"		, "ease-in-back");

	object.appendChild(animation);

	var button = generateButton(obj,1);

	return [object].concat(button);


	//return object;
}

function generateObject(obj)
{
	var object;

	switch(obj.type)
	{
		case 'a-box':
			object = generateBox(obj);
		break;

		case 'a-image':
			object = generateImage(obj);
		break;

		case 'a-plane':
			object = generatePlane(obj);
		break;

		case 'a-entity':
			object = generateModel(obj);
		break;

		case 'text':
			object = generateText(obj);
		break;
	}

	return object;
}

function generateText(obj)
{
	var object 	= document.createElement('a-entity');
	object.setAttribute("text-geometry"	, "value: "+obj.title+"; font: #optimerBoldFont");
	object.setAttribute("position"		, "-1.3 .3 -.3");
	object.setAttribute("rotation"		, obj.rotation);
	object.setAttribute("material"		, obj.material);

	var object1	= document.createElement('a-entity');
	object1.setAttribute("text"	, 		"width: 3; align:center; letterSpacing: 5; color: white; value: "+obj.text);
	object1.setAttribute("position"		, "0 0 .3");
	object1.setAttribute("rotation"		, obj.rotation);

	var plane	= document.createElement('a-plane');
	plane.setAttribute("position"	, "-.5 -.5 0");
	plane.setAttribute("src"		, "#fondo");
	plane.setAttribute("width"		, "4.5");
	plane.setAttribute("height"		, "2.5");
	plane.setAttribute("rotation"	, obj.rotation);
	//plane.setAttribute("href"		, obj.url);
	//plane.setAttribute("target"		, obj.target);

	var button = generateButton(obj,1.7);

	return [object,object1,plane].concat(button);
}

function generateButton(obj,pos)
{
	var object 	= document.createElement('a-plane');
	object.setAttribute("position"	, "-.3 -.3 "+pos);
	object.setAttribute("src"		, "#boton");
	object.setAttribute("title"		, "probando");
	object.setAttribute("width"		, "1");
	object.setAttribute("height"	, ".5");
	object.setAttribute("rotation"	, obj.rotation);
	object.setAttribute("href"		, obj.url);
	object.setAttribute("target"	, obj.target);

	var object1	= document.createElement('a-entity');
	object1.setAttribute("text"	, 		"width: 3; align:center;color: white; value: Apunta aqui");
	object1.setAttribute("position"		, "-.3 -.25 "+pos);
	object1.setAttribute("rotation"		, obj.rotation);

	return [object,object1];
}

function getJSON()
{
	//console.log('getJSON...');

	return new Promise((resolve, reject) =>{
		$.getJSON( "json/test.json", function( data )
		{
			//console.log(data);
			for(var pat in data)
			{
				if(data[pat].object)
				{
					var object 	= generateObject(data[pat].object);
					//console.log('object',object,object[1]);

					var aMarker = document.createElement("a-marker");
					aMarker.setAttribute("preset", data[pat].pattern);

					if(object[1])
					{
						for(var o in object)
						{
							aMarker.appendChild(object[o]);
						}
					}
					else
					{

						aMarker.appendChild(object);
					}

					var scene = document.getElementById("scene");
					//console.log('scene',scene);

					if(scene!=null)
					{
						//scene.appendChild(aMarker);
						$('a-scene').append(aMarker);
					}
					else
					{
						$('a-scene').append(aMarker);
					}





				}
				else
				{
					//console.log(data[pat].pattern)
					//console.log(data[pat].url,' ')
					$('*[preset="'+data[pat].pattern+'"]').attr('href',data[pat].url)
				}

			}
			resolve(data);
		});
	});
}

$(document).ready(function()
{
	//console.log('ready...');
	if(patterns == undefined)
	{
		getJSON().then((data) =>
		{
			patterns = data;
		Object.assign( THREEx.ArToolkitContext.prototype, THREE.EventDispatcher.prototype );

	});
	}
	else
	{
		Object.assign( THREEx.ArToolkitContext.prototype, THREE.EventDispatcher.prototype );
	}

});


// THREEx.ArToolkitContext.baseURL = '../'
// default to github page
THREEx.ArToolkitContext.baseURL = 'https://jeromeetienne.github.io/AR.js/three.js/'
THREEx.ArToolkitContext.REVISION = '1.0.1-dev'


/**
 * Create a default camera for this trackingBackend
 * @param {string} trackingBackend - the tracking to user
 * @return {THREE.Camera} the created camera
 */
THREEx.ArToolkitContext.createDefaultCamera = function( trackingBackend ){
	console.assert(false, 'use ARjs.Utils.createDefaultCamera instead')
	// Create a camera
	if( trackingBackend === 'artoolkit' ){
		var camera = new THREE.Camera();
	}else if( trackingBackend === 'aruco' ){
		var camera = new THREE.PerspectiveCamera(42, renderer.domElement.width / renderer.domElement.height, 0.01, 100);
	}else if( trackingBackend === 'tango' ){
		var camera = new THREE.PerspectiveCamera(42, renderer.domElement.width / renderer.domElement.height, 0.01, 100);
	}else console.assert(false)
	return camera
}


//////////////////////////////////////////////////////////////////////////////
//		init functions
//////////////////////////////////////////////////////////////////////////////
THREEx.ArToolkitContext.prototype.init = function(onCompleted){
	var _this = this
	if( this.parameters.trackingBackend === 'artoolkit' ){
		this._initArtoolkit(done)
	}else if( this.parameters.trackingBackend === 'aruco' ){
		this._initAruco(done)
	}else if( this.parameters.trackingBackend === 'tango' ){
		this._initTango(done)
	}else console.assert(false)
	return

	function done(){
		// dispatch event
		_this.dispatchEvent({
			type: 'initialized'
		});

		onCompleted && onCompleted()
	}

}
////////////////////////////////////////////////////////////////////////////////
//          update function
////////////////////////////////////////////////////////////////////////////////
THREEx.ArToolkitContext.prototype.update = function(srcElement){

	// be sure arController is fully initialized
	if (this.parameters.trackingBackend === 'artoolkit' && this.arController === null) return false;

	// honor this.parameters.maxDetectionRate
	var present = performance.now()
	if( this._updatedAt !== null && present - this._updatedAt < 1000/this.parameters.maxDetectionRate ){
		return false
	}
	this._updatedAt = present

	// mark all markers to invisible before processing this frame
	this._arMarkersControls.forEach(function(markerControls){
		markerControls.object3d.visible = false
	})

	// process this frame
	if(this.parameters.trackingBackend === 'artoolkit'){
		this._updateArtoolkit(srcElement)
	}else if( this.parameters.trackingBackend === 'aruco' ){
		this._updateAruco(srcElement)
	}else if( this.parameters.trackingBackend === 'tango' ){
		this._updateTango(srcElement)
	}else{
		console.assert(false)
	}

	// dispatch event
	this.dispatchEvent({
		type: 'sourceProcessed'
	});


	// return true as we processed the frame
	return true;
}

////////////////////////////////////////////////////////////////////////////////
//          Add/Remove markerControls
////////////////////////////////////////////////////////////////////////////////
THREEx.ArToolkitContext.prototype.addMarker = function(arMarkerControls){
	console.assert(arMarkerControls instanceof THREEx.ArMarkerControls)
	this._arMarkersControls.push(arMarkerControls)
}

THREEx.ArToolkitContext.prototype.removeMarker = function(arMarkerControls){
	console.assert(arMarkerControls instanceof THREEx.ArMarkerControls)
	// console.log('remove marker for', arMarkerControls)
	var index = this.arMarkerControlss.indexOf(artoolkitMarker);
	console.assert(index !== index )
	this._arMarkersControls.splice(index, 1)
}

//////////////////////////////////////////////////////////////////////////////
//		artoolkit specific
//////////////////////////////////////////////////////////////////////////////
THREEx.ArToolkitContext.prototype._initArtoolkit = function(onCompleted){
	var _this = this

	// set this._artoolkitProjectionAxisTransformMatrix to change artoolkit projection matrix axis to match usual webgl one
	this._artoolkitProjectionAxisTransformMatrix = new THREE.Matrix4()
	this._artoolkitProjectionAxisTransformMatrix.multiply(new THREE.Matrix4().makeRotationY(Math.PI))
	this._artoolkitProjectionAxisTransformMatrix.multiply(new THREE.Matrix4().makeRotationZ(Math.PI))

	// get cameraParameters
	var cameraParameters = new ARCameraParam(_this.parameters.cameraParametersUrl, function() {
		// init controller
		var arController = new ARController(_this.parameters.canvasWidth, _this.parameters.canvasHeight, cameraParameters);
		_this.arController = arController

		// honor this.parameters.imageSmoothingEnabled
		arController.ctx.mozImageSmoothingEnabled = _this.parameters.imageSmoothingEnabled;
		arController.ctx.webkitImageSmoothingEnabled = _this.parameters.imageSmoothingEnabled;
		arController.ctx.msImageSmoothingEnabled = _this.parameters.imageSmoothingEnabled;
		arController.ctx.imageSmoothingEnabled = _this.parameters.imageSmoothingEnabled;

		// honor this.parameters.debug
		if( _this.parameters.debug === true ){
			arController.debugSetup();
			arController.canvas.style.position = 'absolute'
			arController.canvas.style.top = '0px'
			arController.canvas.style.opacity = '0.6'
			arController.canvas.style.pointerEvents = 'none'
			arController.canvas.style.zIndex = '-1'
		}

		// setPatternDetectionMode
		var detectionModes = {
			'color'			: artoolkit.AR_TEMPLATE_MATCHING_COLOR,
			'color_and_matrix'	: artoolkit.AR_TEMPLATE_MATCHING_COLOR_AND_MATRIX,
			'mono'			: artoolkit.AR_TEMPLATE_MATCHING_MONO,
			'mono_and_matrix'	: artoolkit.AR_TEMPLATE_MATCHING_MONO_AND_MATRIX,
		}
		var detectionMode = detectionModes[_this.parameters.detectionMode]
		console.assert(detectionMode !== undefined)
		arController.setPatternDetectionMode(detectionMode);

		// setMatrixCodeType
		var matrixCodeTypes = {
			'3x3'		: artoolkit.AR_MATRIX_CODE_3x3,
			'3x3_HAMMING63'	: artoolkit.AR_MATRIX_CODE_3x3_HAMMING63,
			'3x3_PARITY65'	: artoolkit.AR_MATRIX_CODE_3x3_PARITY65,
			'4x4'		: artoolkit.AR_MATRIX_CODE_4x4,
			'4x4_BCH_13_9_3': artoolkit.AR_MATRIX_CODE_4x4_BCH_13_9_3,
			'4x4_BCH_13_5_5': artoolkit.AR_MATRIX_CODE_4x4_BCH_13_5_5,
		}
		var matrixCodeType = matrixCodeTypes[_this.parameters.matrixCodeType]
		console.assert(matrixCodeType !== undefined)
		arController.setMatrixCodeType(matrixCodeType);


		// set thresholding in artoolkit
		// this seems to be the default
		// arController.setThresholdMode(artoolkit.AR_LABELING_THRESH_MODE_MANUAL)
		// adatative consume a LOT of cpu...
		// arController.setThresholdMode(artoolkit.AR_LABELING_THRESH_MODE_AUTO_ADAPTIVE)
		// arController.setThresholdMode(artoolkit.AR_LABELING_THRESH_MODE_AUTO_OTSU)

		// notify
		onCompleted()
	})
	return this
}

/**
 * return the projection matrix
 */
THREEx.ArToolkitContext.prototype.getProjectionMatrix = function(srcElement){


// FIXME rename this function to say it is artoolkit specific - getArtoolkitProjectMatrix
// keep a backward compatibility with a console.warn


	if( this.parameters.trackingBackend === 'aruco' ){
		console.assert(false, 'dont call this function with aruco')
	}else if( this.parameters.trackingBackend === 'artoolkit' ){
		console.assert(this.arController, 'arController MUST be initialized to call this function')
		// get projectionMatrixArr from artoolkit
		var projectionMatrixArr = this.arController.getCameraMatrix();
		var projectionMatrix = new THREE.Matrix4().fromArray(projectionMatrixArr)
	}else console.assert(false)

	// apply context._axisTransformMatrix - change artoolkit axis to match usual webgl one
	projectionMatrix.multiply(this._artoolkitProjectionAxisTransformMatrix)

	// return the result
	return projectionMatrix
}

THREEx.ArToolkitContext.prototype._updateArtoolkit = function(srcElement){
	this.arController.process(srcElement)
}

//////////////////////////////////////////////////////////////////////////////
//		aruco specific
//////////////////////////////////////////////////////////////////////////////
THREEx.ArToolkitContext.prototype._initAruco = function(onCompleted){
	this.arucoContext = new THREEx.ArucoContext()

	// honor this.parameters.canvasWidth/.canvasHeight
	this.arucoContext.canvas.width = this.parameters.canvasWidth
	this.arucoContext.canvas.height = this.parameters.canvasHeight

	// honor this.parameters.imageSmoothingEnabled
	var context = this.arucoContext.canvas.getContext('2d')
	// context.mozImageSmoothingEnabled = this.parameters.imageSmoothingEnabled;
	context.webkitImageSmoothingEnabled = this.parameters.imageSmoothingEnabled;
	context.msImageSmoothingEnabled = this.parameters.imageSmoothingEnabled;
	context.imageSmoothingEnabled = this.parameters.imageSmoothingEnabled;


	setTimeout(function(){
		onCompleted()
	}, 0)
}


THREEx.ArToolkitContext.prototype._updateAruco = function(srcElement){
	// console.log('update aruco here')
	var _this = this
	var arMarkersControls = this._arMarkersControls
	var detectedMarkers = this.arucoContext.detect(srcElement)

	detectedMarkers.forEach(function(detectedMarker){
		var foundControls = null
		for(var i = 0; i < arMarkersControls.length; i++){
			console.assert( arMarkersControls[i].parameters.type === 'barcode' )
			if( arMarkersControls[i].parameters.barcodeValue === detectedMarker.id ){
				foundControls = arMarkersControls[i]
				break;
			}
		}
		if( foundControls === null )	return

		var tmpObject3d = new THREE.Object3D
		_this.arucoContext.updateObject3D(tmpObject3d, foundControls._arucoPosit, foundControls.parameters.size, detectedMarker);
		tmpObject3d.updateMatrix()

		foundControls.updateWithModelViewMatrix(tmpObject3d.matrix)
	})
}

//////////////////////////////////////////////////////////////////////////////
//		tango specific
//////////////////////////////////////////////////////////////////////////////
THREEx.ArToolkitContext.prototype._initTango = function(onCompleted){
	var _this = this
	// check webvr is available
	if (navigator.getVRDisplays) {
		// do nothing
	} else if (navigator.getVRDevices) {
		alert("Your browser supports WebVR but not the latest version. See <a href='http://webvr.info'>webvr.info</a> for more info.");
	} else {
		alert("Your browser does not support WebVR. See <a href='http://webvr.info'>webvr.info</a> for assistance.");
	}


	this._tangoContext = {
		vrDisplay: null,
		vrPointCloud: null,
		frameData: new VRFrameData(),
	}


	// get vrDisplay
	navigator.getVRDisplays().then(function (vrDisplays) {
		if( vrDisplays.length === 0 )	alert('no vrDisplays available')
		var vrDisplay = _this._tangoContext.vrDisplay = vrDisplays[0]

		console.log('vrDisplays.displayName :', vrDisplay.displayName)

		// init vrPointCloud
		if( vrDisplay.displayName === "Tango VR Device" ){
			_this._tangoContext.vrPointCloud = new THREE.WebAR.VRPointCloud(vrDisplay, true)
		}

		// NOTE it doesnt seem necessary and it fails on tango
		// var canvasElement = document.createElement('canvas')
		// document.body.appendChild(canvasElement)
		// _this._tangoContext.requestPresent([{ source: canvasElement }]).then(function() {
		// 	console.log('vrdisplay request accepted')
		// });

		onCompleted()
	});
}


THREEx.ArToolkitContext.prototype._updateTango = function(srcElement){
	// console.log('update aruco here')
	var _this = this
	var arMarkersControls = this._arMarkersControls
	var tangoContext= this._tangoContext
	var vrDisplay = this._tangoContext.vrDisplay

	// check vrDisplay is already initialized
	if( vrDisplay === null )	return


	// Update the point cloud. Only if the point cloud will be shown the geometry is also updated.
	if( vrDisplay.displayName === "Tango VR Device" ){
		var showPointCloud = true
		var pointsToSkip = 0
		_this._tangoContext.vrPointCloud.update(showPointCloud, pointsToSkip, true)
	}


	if( this._arMarkersControls.length === 0 )	return

	// TODO here do a fake search on barcode/1001 ?

	var foundControls = this._arMarkersControls[0]

	var frameData = this._tangoContext.frameData

	// read frameData
	vrDisplay.getFrameData(frameData);

	if( frameData.pose.position === null )		return
	if( frameData.pose.orientation === null )	return

	// create cameraTransformMatrix
	var position = new THREE.Vector3().fromArray(frameData.pose.position)
	var quaternion = new THREE.Quaternion().fromArray(frameData.pose.orientation)
	var scale = new THREE.Vector3(1,1,1)
	var cameraTransformMatrix = new THREE.Matrix4().compose(position, quaternion, scale)
	// compute modelViewMatrix from cameraTransformMatrix
	var modelViewMatrix = new THREE.Matrix4()
	modelViewMatrix.getInverse( cameraTransformMatrix )

	foundControls.updateWithModelViewMatrix(modelViewMatrix)

	// console.log('position', position)
	// if( position.x !== 0 ||  position.y !== 0 ||  position.z !== 0 ){
	// 	console.log('vrDisplay tracking')
	// }else{
	// 	console.log('vrDisplay NOT tracking')
	// }

}
var THREEx = THREEx || {}




/**
 * ArToolkitProfile helps you build parameters for artoolkit
 * - it is fully independent of the rest of the code
 * - all the other classes are still expecting normal parameters
 * - you can use this class to understand how to tune your specific usecase
 * - it is made to help people to build parameters without understanding all the underlying details.
 */
THREEx.ArToolkitProfile = function()
{

	this.reset()

	this.performance('default')
}


THREEx.ArToolkitProfile.prototype._guessPerformanceLabel = function() {
	var isMobile = navigator.userAgent.match(/Android/i)
	|| navigator.userAgent.match(/webOS/i)
	|| navigator.userAgent.match(/iPhone/i)
	|| navigator.userAgent.match(/iPad/i)
	|| navigator.userAgent.match(/iPod/i)
	|| navigator.userAgent.match(/BlackBerry/i)
	|| navigator.userAgent.match(/Windows Phone/i)
		? true : false
	if( isMobile === true ){
		return 'phone-normal'
	}
	return 'desktop-normal'
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

/**
 * reset all parameters
 */
THREEx.ArToolkitProfile.prototype.reset = function () {
	this.sourceParameters = {
		// to read from the webcam
		sourceType : 'webcam',
	}

	this.contextParameters = {
		cameraParametersUrl: THREEx.ArToolkitContext.baseURL + '../data/data/camera_para.dat',
		detectionMode: 'mono',
	}
	this.defaultMarkerParameters = {
		type : 'pattern',
		patternUrl : THREEx.ArToolkitContext.baseURL + '../data/data/patt.hiro'
	}

	return this
};

//////////////////////////////////////////////////////////////////////////////
//		Performance
//////////////////////////////////////////////////////////////////////////////



THREEx.ArToolkitProfile.prototype.performance = function(label) {
	if( label === 'default' ){
		label = this._guessPerformanceLabel()
	}

	if( label === 'desktop-fast' ){
		this.contextParameters.sourceWidth = 640*3
		this.contextParameters.sourceHeight = 480*3

		this.contextParameters.maxDetectionRate = 30
	}else if( label === 'desktop-normal' ){
		this.contextParameters.sourceWidth = 640
		this.contextParameters.sourceHeight = 480

		this.contextParameters.maxDetectionRate = 60
	}else if( label === 'phone-normal' ){
		this.contextParameters.sourceWidth = 80*4
		this.contextParameters.sourceHeight = 60*4

		this.contextParameters.maxDetectionRate = 30
	}else if( label === 'phone-slow' ){
		this.contextParameters.sourceWidth = 80*3
		this.contextParameters.sourceHeight = 60*3

		this.contextParameters.maxDetectionRate = 30
	}else {
		console.assert(false, 'unknonwn label '+label)
	}
}

//////////////////////////////////////////////////////////////////////////////
//		Marker
//////////////////////////////////////////////////////////////////////////////


THREEx.ArToolkitProfile.prototype.defaultMarker = function (trackingBackend) {
	trackingBackend = trackingBackend || this.contextParameters.trackingBackend

	if( trackingBackend === 'artoolkit' ){
		this.contextParameters.detectionMode = 'mono'
		this.defaultMarkerParameters.type = 'pattern'
		this.defaultMarkerParameters.patternUrl = THREEx.ArToolkitContext.baseURL + '../data/data/patt.hiro'
	}else if( trackingBackend === 'aruco' ){
		this.contextParameters.detectionMode = 'mono'
		this.defaultMarkerParameters.type = 'barcode'
		this.defaultMarkerParameters.barcodeValue = 1001
	}else if( trackingBackend === 'tango' ){
		// FIXME temporary placeholder - to reevaluate later
		this.defaultMarkerParameters.type = 'barcode'
		this.defaultMarkerParameters.barcodeValue = 1001
	}else console.assert(false)

	return this
}
//////////////////////////////////////////////////////////////////////////////
//		Source
//////////////////////////////////////////////////////////////////////////////
THREEx.ArToolkitProfile.prototype.sourceWebcam = function () {
	this.sourceParameters.sourceType = 'webcam'
	delete this.sourceParameters.sourceUrl
	return this
}


THREEx.ArToolkitProfile.prototype.sourceVideo = function (url) {
	this.sourceParameters.sourceType = 'video'
	this.sourceParameters.sourceUrl = url
	return this
}

THREEx.ArToolkitProfile.prototype.sourceImage = function (url) {
	this.sourceParameters.sourceType = 'image'
	this.sourceParameters.sourceUrl = url
	return this
}

//////////////////////////////////////////////////////////////////////////////
//		trackingBackend
//////////////////////////////////////////////////////////////////////////////
THREEx.ArToolkitProfile.prototype.trackingBackend = function (trackingBackend) {
	this.contextParameters.trackingBackend = trackingBackend
	return this
}
var THREEx = THREEx || {}

THREEx.ArToolkitSource = function(parameters){
	// handle default parameters
	this.parameters = {
		// type of source - ['webcam', 'image', 'video']
		sourceType : parameters.sourceType !== undefined ? parameters.sourceType : 'webcam',
		// url of the source - valid if sourceType = image|video
		sourceUrl : parameters.sourceUrl !== undefined ? parameters.sourceUrl : null,

		// resolution of at which we initialize in the source image
		sourceWidth: parameters.sourceWidth !== undefined ? parameters.sourceWidth : 640,
		sourceHeight: parameters.sourceHeight !== undefined ? parameters.sourceHeight : 480,
		// resolution displayed for the source
		displayWidth: parameters.displayWidth !== undefined ? parameters.displayWidth : 640,
		displayHeight: parameters.displayHeight !== undefined ? parameters.displayHeight : 480,
	}

	this.ready = false
	this.domElement = null
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
THREEx.ArToolkitSource.prototype.init = function(onReady){
	var _this = this

	if( this.parameters.sourceType === 'image' ){
		var domElement = this._initSourceImage(onSourceReady)
	}else if( this.parameters.sourceType === 'video' ){
		var domElement = this._initSourceVideo(onSourceReady)
	}else if( this.parameters.sourceType === 'webcam' ){
		// var domElement = this._initSourceWebcamOld(onSourceReady)
		var domElement = this._initSourceWebcam(onSourceReady)
	}else{
		console.assert(false)
	}

	// attach
	this.domElement = domElement
	this.domElement.style.position = 'absolute'
	this.domElement.style.top = '0px'
	this.domElement.style.left = '0px'
	this.domElement.style.zIndex = '-2'

	return this
	function onSourceReady(){
		document.body.appendChild(_this.domElement);

		_this.ready = true

		onReady && onReady()
	}
}

////////////////////////////////////////////////////////////////////////////////
//          init image source
////////////////////////////////////////////////////////////////////////////////


THREEx.ArToolkitSource.prototype._initSourceImage = function(onReady) {
	// TODO make it static
	var domElement = document.createElement('img')
	domElement.src = this.parameters.sourceUrl

	domElement.width = this.parameters.sourceWidth
	domElement.height = this.parameters.sourceHeight
	domElement.style.width = this.parameters.displayWidth+'px'
	domElement.style.height = this.parameters.displayHeight+'px'

	// wait until the video stream is ready
	var interval = setInterval(function() {
		if (!domElement.naturalWidth)	return;
		onReady()
		clearInterval(interval)
	}, 1000/50);

	return domElement
}

////////////////////////////////////////////////////////////////////////////////
//          init video source
////////////////////////////////////////////////////////////////////////////////


THREEx.ArToolkitSource.prototype._initSourceVideo = function(onReady) {
	// TODO make it static
	var domElement = document.createElement('video');
	domElement.src = this.parameters.sourceUrl

	domElement.style.objectFit = 'initial'

	domElement.autoplay = true;
	domElement.webkitPlaysinline = true;
	domElement.controls = false;
	domElement.loop = true;
	domElement.muted = true

	// trick to trigger the video on android
	document.body.addEventListener('click', function onClick(){
		document.body.removeEventListener('click', onClick);
		domElement.play()
	})

	domElement.width = this.parameters.sourceWidth
	domElement.height = this.parameters.sourceHeight
	domElement.style.width = this.parameters.displayWidth+'px'
	domElement.style.height = this.parameters.displayHeight+'px'

	// wait until the video stream is ready
	var interval = setInterval(function() {
		if (!domElement.videoWidth)	return;
		onReady()
		clearInterval(interval)
	}, 1000/50);
	return domElement
}

////////////////////////////////////////////////////////////////////////////////
//          handle webcam source
////////////////////////////////////////////////////////////////////////////////

THREEx.ArToolkitSource.prototype._initSourceWebcam = function(onReady) {
	var _this = this

	var domElement = document.createElement('video');
	domElement.setAttribute('autoplay', '');
	domElement.setAttribute('muted', '');
	domElement.setAttribute('playsinline', '');
	domElement.style.width = this.parameters.displayWidth+'px'
	domElement.style.height = this.parameters.displayHeight+'px'

	if (navigator.mediaDevices === undefined
		|| navigator.mediaDevices.enumerateDevices === undefined
		|| navigator.mediaDevices.getUserMedia === undefined  ){
		alert("WebRTC issue! navigator.mediaDevices.enumerateDevices not present in your browser");
	}

	navigator.mediaDevices.enumerateDevices().then(function(devices) {
		var userMediaConstraints = {
			audio: false,
			video: {
				facingMode: 'environment',
				width: {
					ideal: _this.parameters.sourceWidth,
					// min: 1024,
					// max: 1920
				},
				height: {
					ideal: _this.parameters.sourceHeight,
					// min: 776,
					// max: 1080
				}
			}
		}
		navigator.mediaDevices.getUserMedia(userMediaConstraints).then(function success(stream) {
			// set the .src of the domElement
			domElement.srcObject = stream;
			// to start the video, when it is possible to start it only on userevent. like in android
			document.body.addEventListener('click', function(){
				domElement.play();
			})
			// domElement.play();
// TODO listen to loadedmetadata instead
			// wait until the video stream is ready
			var interval = setInterval(function() {
				if (!domElement.videoWidth)	return;
				onReady()
				clearInterval(interval)
			}, 1000/50);
		}).catch(function(error) {
			console.log("Can't access user media", error);
			alert("Can't access user media :()");
		});
	}).catch(function(err) {
		console.log(err.name + ": " + err.message);
	});

	return domElement
}

//////////////////////////////////////////////////////////////////////////////
//		Handle Mobile Torch
//////////////////////////////////////////////////////////////////////////////
THREEx.ArToolkitSource.prototype.hasMobileTorch = function(){
	var stream = arToolkitSource.domElement.srcObject
	if( stream instanceof MediaStream === false )	return false

	if( this._currentTorchStatus === undefined ){
		this._currentTorchStatus = false
	}

	var videoTrack = stream.getVideoTracks()[0];
	var capabilities = videoTrack.getCapabilities()

	return capabilities.torch ? true : false
}

/**
 * - toggle the flash/torch of the mobile fun if applicable
 * Great post about it https://www.oberhofer.co/mediastreamtrack-and-its-capabilities/
 */
THREEx.ArToolkitSource.prototype.toggleMobileTorch = function(){
	var stream = arToolkitSource.domElement.srcObject
	if( stream instanceof MediaStream === false ){
		alert('enabling mobile torch is available only on webcam')
		return
	}

	if( this._currentTorchStatus === undefined ){
		this._currentTorchStatus = false
	}

	var videoTrack = stream.getVideoTracks()[0];
	var capabilities = videoTrack.getCapabilities()

	if( !capabilities.torch ){
		alert('no mobile torch is available on your camera')
		return
	}

	this._currentTorchStatus = this._currentTorchStatus === false ? true : false
	videoTrack.applyConstraints({
		advanced: [{
			torch: this._currentTorchStatus
		}]
	}).catch(function(error){
		console.log(error)
	});
}

////////////////////////////////////////////////////////////////////////////////
//          handle resize
////////////////////////////////////////////////////////////////////////////////

THREEx.ArToolkitSource.prototype.onResizeElement = function(mirrorDomElements){
	var _this = this
	var screenWidth = window.innerWidth
	var screenHeight = window.innerHeight

	// compute sourceWidth, sourceHeight
	if( this.domElement.nodeName === "IMG" ){
		var sourceWidth = this.domElement.naturalWidth
		var sourceHeight = this.domElement.naturalHeight
	}else if( this.domElement.nodeName === "VIDEO" ){
		var sourceWidth = this.domElement.videoWidth
		var sourceHeight = this.domElement.videoHeight
	}else{
		console.assert(false)
	}

	// compute sourceAspect
	var sourceAspect = sourceWidth / sourceHeight
	// compute screenAspect
	var screenAspect = screenWidth / screenHeight

	// if screenAspect < sourceAspect, then change the width, else change the height
	if( screenAspect < sourceAspect ){
		// compute newWidth and set .width/.marginLeft
		var newWidth = sourceAspect * screenHeight
		this.domElement.style.width = newWidth+'px'
		this.domElement.style.marginLeft = -(newWidth-screenWidth)/2+'px'

		// init style.height/.marginTop to normal value
		this.domElement.style.height = screenHeight+'px'
		this.domElement.style.marginTop = '0px'
	}else{
		// compute newHeight and set .height/.marginTop
		var newHeight = 1 / (sourceAspect / screenWidth)
		this.domElement.style.height = newHeight+'px'
		this.domElement.style.marginTop = -(newHeight-screenHeight)/2+'px'

		// init style.width/.marginLeft to normal value
		this.domElement.style.width = screenWidth+'px'
		this.domElement.style.marginLeft = '0px'
	}


	if( arguments.length !== 0 ){
		debugger
		console.warn('use bad signature for arToolkitSource.copyElementSizeTo')
	}
	// honor default parameters
	// if( mirrorDomElements !== undefined )	console.warn('still use the old resize. fix it')
	if( mirrorDomElements === undefined )	mirrorDomElements = []
	if( mirrorDomElements instanceof Array === false )	mirrorDomElements = [mirrorDomElements]

	// Mirror _this.domElement.style to mirrorDomElements
	mirrorDomElements.forEach(function(domElement){
		_this.copyElementSizeTo(domElement)
	})
}

THREEx.ArToolkitSource.prototype.copyElementSizeTo = function(otherElement){
	otherElement.style.width = this.domElement.style.width
	otherElement.style.height = this.domElement.style.height
	otherElement.style.marginLeft = this.domElement.style.marginLeft
	otherElement.style.marginTop = this.domElement.style.marginTop
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

THREEx.ArToolkitSource.prototype.copySizeTo = function(){
	console.warn('obsolete function arToolkitSource.copySizeTo. Use arToolkitSource.copyElementSizeTo' )
	this.copyElementSizeTo.apply(this, arguments)
}

THREEx.ArToolkitSource.prototype.onResize = function(){
	console.warn('obsolete function arToolkitSource.onResize. Use arToolkitSource.onResizeElement' )
	this.onResizeElement.apply(this, arguments)
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

THREEx.ArToolkitSource.prototype.onResize2	= function(arToolkitContext, renderer, camera){
	var trackingBackend = arToolkitContext.parameters.trackingBackend

	// RESIZE DOMELEMENT
	if( trackingBackend === 'artoolkit' ){

		this.onResizeElement()

		var isAframe = renderer.domElement.dataset.aframeCanvas ? true : false
		if( isAframe === false ){
			this.copyElementSizeTo(renderer.domElement)
		}else{

		}

		if( arToolkitContext.arController !== null ){
			this.copyElementSizeTo(arToolkitContext.arController.canvas)
		}
	}else if( trackingBackend === 'aruco' ){
		this.onResizeElement()
		this.copyElementSizeTo(renderer.domElement)

		this.copyElementSizeTo(arToolkitContext.arucoContext.canvas)
	}else if( trackingBackend === 'tango' ){
		renderer.setSize( window.innerWidth, window.innerHeight )
	}else console.assert(false, 'unhandled trackingBackend '+trackingBackend)


	// UPDATE CAMERA
	if( trackingBackend === 'artoolkit' ){
		camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() );
	}else if( trackingBackend === 'aruco' ){
		camera.aspect = renderer.domElement.width / renderer.domElement.height;
		camera.updateProjectionMatrix();
	}else if( trackingBackend === 'tango' ){
		var vrDisplay = arToolkitContext._tangoContext.vrDisplay
		// make camera fit vrDisplay
		if( vrDisplay && vrDisplay.displayName === "Tango VR Device" ) THREE.WebAR.resizeVRSeeThroughCamera(vrDisplay, camera)
	}else console.assert(false, 'unhandled trackingBackend '+trackingBackend)
}
var THREEx = THREEx || {}

THREEx.ArVideoInWebgl = function(videoTexture){
	var _this = this

	//////////////////////////////////////////////////////////////////////////////
	//	plane always in front of the camera, exactly as big as the viewport
	//////////////////////////////////////////////////////////////////////////////
	var geometry = new THREE.PlaneGeometry(2, 2);
	var material = new THREE.MeshBasicMaterial({
		// map : new THREE.TextureLoader().load('images/water.jpg'),
		map : videoTexture,
		// side: THREE.DoubleSide,
		// opacity: 0.5,
		// color: 'pink',
		// transparent: true,
	});
	var seethruPlane = new THREE.Mesh(geometry, material);
	this.object3d = seethruPlane
	// scene.add(seethruPlane);

	// arToolkitSource.domElement.style.visibility = 'hidden'

	// TODO extract the fov from the projectionMatrix
	// camera.fov = 43.1
	this.update = function(camera){
		camera.updateMatrixWorld(true)

		// get seethruPlane position
		var position = new THREE.Vector3(-0,0,-20)	// TODO how come you got that offset on x ???
		var position = new THREE.Vector3(-0,0,-20)	// TODO how come you got that offset on x ???
		seethruPlane.position.copy(position)
		camera.localToWorld(seethruPlane.position)

		// get seethruPlane quaternion
		camera.matrixWorld.decompose( camera.position, camera.quaternion, camera.scale );
		seethruPlane.quaternion.copy( camera.quaternion )

		// extract the fov from the projectionMatrix
		var fov = THREE.Math.radToDeg(Math.atan(1/camera.projectionMatrix.elements[5]))*2;
		// console.log('fov', fov)

		var elementWidth = parseFloat( arToolkitSource.domElement.style.width.replace(/px$/,''), 10 )
		var elementHeight = parseFloat( arToolkitSource.domElement.style.height.replace(/px$/,''), 10 )

		var aspect = elementWidth / elementHeight

		// camera.fov = fov
		// if( vrDisplay.isPresenting ){
		// 	fov *= 2
		// 	aspect *= 2
		// }

		// get seethruPlane height relative to fov
		seethruPlane.scale.y = Math.tan(THREE.Math.DEG2RAD * fov/2)*position.length()
		// get seethruPlane aspect
		seethruPlane.scale.x = seethruPlane.scale.y * aspect
	}

	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////
	// var video = arToolkitSource.domElement;
	//
	// window.addEventListener('resize', function(){
	// 	updateSeeThruAspectUv(seethruPlane)
	// })
	// video.addEventListener('canplaythrough', function(){
	// 	updateSeeThruAspectUv(seethruPlane)
	// })
	// function updateSeeThruAspectUv(plane){
	//
	// 	// if video isnt yet ready to play
	// 	if( video.videoWidth === 0 || video.videoHeight === 0 )	return
	//
	// 	var faceVertexUvs = plane.geometry.faceVertexUvs[0]
	// 	var screenAspect = window.innerWidth / window.innerHeight
	// 	var videoAspect = video.videoWidth / video.videoHeight
	//
	// 	plane.geometry.uvsNeedUpdate = true
	// 	if( screenAspect >= videoAspect ){
	// 		var actualHeight = videoAspect / screenAspect;
	// 		// faceVertexUvs y 0
	// 		faceVertexUvs[0][1].y = 0.5 - actualHeight/2
	// 		faceVertexUvs[1][0].y = 0.5 - actualHeight/2
	// 		faceVertexUvs[1][1].y = 0.5 - actualHeight/2
	// 		// faceVertexUvs y 1
	// 		faceVertexUvs[0][0].y = 0.5 + actualHeight/2
	// 		faceVertexUvs[0][2].y = 0.5 + actualHeight/2
	// 		faceVertexUvs[1][2].y = 0.5 + actualHeight/2
	// 	}else{
	// 		var actualWidth = screenAspect / videoAspect;
	// 		// faceVertexUvs x 0
	// 		faceVertexUvs[0][0].x = 0.5 - actualWidth/2
	// 		faceVertexUvs[0][1].x = 0.5 - actualWidth/2
	// 		faceVertexUvs[1][0].x = 0.5 - actualWidth/2
	//
	// 		// faceVertexUvs x 1
	// 		faceVertexUvs[0][2].x = 0.5 + actualWidth/2
	// 		faceVertexUvs[1][1].x = 0.5 + actualWidth/2
	// 		faceVertexUvs[1][2].x = 0.5 + actualWidth/2
	// 	}
	// }

}
var THREEx = THREEx || {}

THREEx.ArMultiMarkerControls = function(arToolkitContext, object3d, parameters){
	var _this = this
	THREEx.ArBaseControls.call(this, object3d)

	if( arguments.length > 3 )	console.assert('wrong api for', THREEx.ArMultiMarkerControls)

// have a parameters in argument
	this.parameters = {
		// list of controls for each subMarker
		subMarkersControls: parameters.subMarkersControls,
		// list of pose for each subMarker relative to the origin
		subMarkerPoses: parameters.subMarkerPoses,
		// change matrix mode - [modelViewMatrix, cameraTransformMatrix]
		changeMatrixMode : parameters.changeMatrixMode !== undefined ? parameters.changeMatrixMode : 'modelViewMatrix',
	}

	this.object3d.visible = false
	// honor obsolete stuff - add a warning to use
	this.subMarkersControls = this.parameters.subMarkersControls
	this.subMarkerPoses = this.parameters.subMarkerPoses

	// listen to arToolkitContext event 'sourceProcessed'
	// - after we fully processed one image, aka when we know all detected poses in it
	arToolkitContext.addEventListener('sourceProcessed', function(){
		_this._onSourceProcessed()
	})
}

THREEx.ArMultiMarkerControls.prototype = Object.create( THREEx.ArBaseControls.prototype );
THREEx.ArMultiMarkerControls.prototype.constructor = THREEx.ArMultiMarkerControls;

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////


/**
 * What to do when a image source is fully processed
 */
THREEx.ArMultiMarkerControls.prototype._onSourceProcessed = function(){
	var _this = this
	var stats = {
		count: 0,
		position : {
			sum: new THREE.Vector3(0,0,0),
			average: new THREE.Vector3(0,0,0),
		},
		quaternion : {
			sum: new THREE.Quaternion(0,0,0,0),
			average: new THREE.Quaternion(0,0,0,0),
		},
		scale : {
			sum: new THREE.Vector3(0,0,0),
			average: new THREE.Vector3(0,0,0),
		},
	}

	var firstQuaternion = _this.parameters.subMarkersControls[0].object3d.quaternion

	this.parameters.subMarkersControls.forEach(function(markerControls, markerIndex){

		var markerObject3d = markerControls.object3d
		// if this marker is not visible, ignore it
		if( markerObject3d.visible === false )	return

		// transformation matrix of this.object3d according to this sub-markers
		var matrix = markerObject3d.matrix.clone()
		var markerPose = _this.parameters.subMarkerPoses[markerIndex]
		matrix.multiply(new THREE.Matrix4().getInverse(markerPose))

		// decompose the matrix into .position, .quaternion, .scale
		var position = new THREE.Vector3
		var quaternion = new THREE.Quaternion()
		var scale = new THREE.Vector3
		matrix.decompose(position, quaternion, scale)

		// http://wiki.unity3d.com/index.php/Averaging_Quaternions_and_Vectors
		stats.count++

		THREEx.ArMultiMarkerControls.averageVector3(stats.position.sum, position, stats.count, stats.position.average)
		THREEx.ArMultiMarkerControls.averageQuaternion(stats.quaternion.sum, quaternion, firstQuaternion, stats.count, stats.quaternion.average)
		THREEx.ArMultiMarkerControls.averageVector3(stats.scale.sum, scale, stats.count, stats.scale.average)
	})

	// honor _this.object3d.visible
	if( stats.count > 0 ){
		_this.object3d.visible = true
	}else{
		_this.object3d.visible = false
	}

	// if at least one sub-marker has been detected, make the average of all detected markers
	if( stats.count > 0 ){
		// compute modelViewMatrix
		var modelViewMatrix = new THREE.Matrix4()
		modelViewMatrix.compose(stats.position.average, stats.quaternion.average, stats.scale.average)

		// change _this.object3d.matrix based on parameters.changeMatrixMode
		if( this.parameters.changeMatrixMode === 'modelViewMatrix' ){
			_this.object3d.matrix.copy(modelViewMatrix)
		}else if( this.parameters.changeMatrixMode === 'cameraTransformMatrix' ){
			_this.object3d.matrix.getInverse( modelViewMatrix )
		}else {
			console.assert(false)
		}

		// decompose - the matrix into .position, .quaternion, .scale
		_this.object3d.matrix.decompose(_this.object3d.position, _this.object3d.quaternion, _this.object3d.scale)
	}

}

//////////////////////////////////////////////////////////////////////////////
//		Utility functions
//////////////////////////////////////////////////////////////////////////////

/**
 * from http://wiki.unity3d.com/index.php/Averaging_Quaternions_and_Vectors
 */
THREEx.ArMultiMarkerControls.averageQuaternion = function(quaternionSum, newQuaternion, firstQuaternion, count, quaternionAverage){
	quaternionAverage = quaternionAverage || new THREE.Quaternion()
	// sanity check
	console.assert(firstQuaternion instanceof THREE.Quaternion === true)

	// from http://wiki.unity3d.com/index.php/Averaging_Quaternions_and_Vectors
	if( newQuaternion.dot(firstQuaternion) > 0 ){
		newQuaternion = new THREE.Quaternion(-newQuaternion.x, -newQuaternion.y, -newQuaternion.z, -newQuaternion.w)
	}

	quaternionSum.x += newQuaternion.x
	quaternionSum.y += newQuaternion.y
	quaternionSum.z += newQuaternion.z
	quaternionSum.w += newQuaternion.w

	quaternionAverage.x = quaternionSum.x/count
	quaternionAverage.y = quaternionSum.y/count
	quaternionAverage.z = quaternionSum.z/count
	quaternionAverage.w = quaternionSum.w/count

	quaternionAverage.normalize()

	return quaternionAverage
}


THREEx.ArMultiMarkerControls.averageVector3 = function(vector3Sum, vector3, count, vector3Average){
	vector3Average = vector3Average || new THREE.Vector3()

	vector3Sum.x += vector3.x
	vector3Sum.y += vector3.y
	vector3Sum.z += vector3.z

	vector3Average.x = vector3Sum.x / count
	vector3Average.y = vector3Sum.y / count
	vector3Average.z = vector3Sum.z / count

	return vector3Average
}

//////////////////////////////////////////////////////////////////////////////
//		Utility function
//////////////////////////////////////////////////////////////////////////////

/**
 * compute the center of this multimarker file
 */
THREEx.ArMultiMarkerControls.computeCenter = function(jsonData){
	var multiMarkerFile = JSON.parse(jsonData)
	var stats = {
		count : 0,
		position : {
			sum: new THREE.Vector3(0,0,0),
			average: new THREE.Vector3(0,0,0),
		},
		quaternion : {
			sum: new THREE.Quaternion(0,0,0,0),
			average: new THREE.Quaternion(0,0,0,0),
		},
		scale : {
			sum: new THREE.Vector3(0,0,0),
			average: new THREE.Vector3(0,0,0),
		},
	}
	var firstQuaternion = new THREE.Quaternion() // FIXME ???

	multiMarkerFile.subMarkersControls.forEach(function(item){
		var poseMatrix = new THREE.Matrix4().fromArray(item.poseMatrix)

		var position = new THREE.Vector3
		var quaternion = new THREE.Quaternion
		var scale = new THREE.Vector3
		poseMatrix.decompose(position, quaternion, scale)

		// http://wiki.unity3d.com/index.php/Averaging_Quaternions_and_Vectors
		stats.count++

		THREEx.ArMultiMarkerControls.averageVector3(stats.position.sum, position, stats.count, stats.position.average)
		THREEx.ArMultiMarkerControls.averageQuaternion(stats.quaternion.sum, quaternion, firstQuaternion, stats.count, stats.quaternion.average)
		THREEx.ArMultiMarkerControls.averageVector3(stats.scale.sum, scale, stats.count, stats.scale.average)
	})

	var averageMatrix = new THREE.Matrix4()
	averageMatrix.compose(stats.position.average, stats.quaternion.average, stats.scale.average)

	return averageMatrix
}

THREEx.ArMultiMarkerControls.computeBoundingBox = function(jsonData){
	var multiMarkerFile = JSON.parse(jsonData)
	var boundingBox = new THREE.Box3()

	multiMarkerFile.subMarkersControls.forEach(function(item){
		var poseMatrix = new THREE.Matrix4().fromArray(item.poseMatrix)

		var position = new THREE.Vector3
		var quaternion = new THREE.Quaternion
		var scale = new THREE.Vector3
		poseMatrix.decompose(position, quaternion, scale)

		boundingBox.expandByPoint(position)
	})

	return boundingBox
}
//////////////////////////////////////////////////////////////////////////////
//		updateSmoothedControls
//////////////////////////////////////////////////////////////////////////////

THREEx.ArMultiMarkerControls.prototype.updateSmoothedControls = function(smoothedControls, lerpsValues){
	// handle default values
	if( lerpsValues === undefined ){
		// FIXME this parameter format is uselessly cryptic
		// lerpValues = [
		// {lerpPosition: 0.5, lerpQuaternion: 0.2, lerpQuaternion: 0.7}
		// ]
		lerpsValues = [
			[0.1, 0.1, 0.3],
			[0.2, 0.1, 0.4],
			[0.2, 0.2, 0.5],
			[0.3, 0.2, 0.7],
			[0.3, 0.2, 0.7],
		]
	}
	// count how many subMarkersControls are visible
	var nVisible = 0
	this.parameters.subMarkersControls.forEach(function(markerControls, markerIndex){
		var markerObject3d = markerControls.object3d
		if( markerObject3d.visible === true )	nVisible ++
	})

	// find the good lerpValues
	if( lerpsValues[nVisible-1] !== undefined ){
		var lerpValues = lerpsValues[nVisible-1]
	}else{
		var lerpValues = lerpsValues[lerpsValues.length-1]
	}

	// modify lerpValues in smoothedControls
	smoothedControls.parameters.lerpPosition = lerpValues[0]
	smoothedControls.parameters.lerpQuaternion = lerpValues[1]
	smoothedControls.parameters.lerpScale = lerpValues[2]
}


//////////////////////////////////////////////////////////////////////////////
//		Create THREEx.ArMultiMarkerControls from JSON
//////////////////////////////////////////////////////////////////////////////

THREEx.ArMultiMarkerControls.fromJSON = function(arToolkitContext, parent3D, markerRoot, jsonData, parameters){
	var multiMarkerFile = JSON.parse(jsonData)
	// declare variables
	var subMarkersControls = []
	var subMarkerPoses = []
	// handle default arguments
	parameters = parameters || {}

	// prepare the parameters
	multiMarkerFile.subMarkersControls.forEach(function(item){
		// create a markerRoot
		var markerRoot = new THREE.Object3D()
		parent3D.add(markerRoot)

		// create markerControls for our markerRoot
		var subMarkerControls = new THREEx.ArMarkerControls(arToolkitContext, markerRoot, item.parameters)

// if( true ){
		// store it in the parameters
		subMarkersControls.push(subMarkerControls)
		subMarkerPoses.push(new THREE.Matrix4().fromArray(item.poseMatrix))
// }else{
// 		// build a smoothedControls
// 		var smoothedRoot = new THREE.Group()
// 		parent3D.add(smoothedRoot)
// 		var smoothedControls = new THREEx.ArSmoothedControls(smoothedRoot, {
// 			lerpPosition : 0.1,
// 			lerpQuaternion : 0.1,
// 			lerpScale : 0.1,
// 			minVisibleDelay: 0,
// 			minUnvisibleDelay: 0,
// 		})
// 		onRenderFcts.push(function(delta){
// 			smoothedControls.update(markerRoot)	// TODO this is a global
// 		})
//
//
// 		// store it in the parameters
// 		subMarkersControls.push(smoothedControls)
// 		subMarkerPoses.push(new THREE.Matrix4().fromArray(item.poseMatrix))
// }
	})

	parameters.subMarkersControls = subMarkersControls
	parameters.subMarkerPoses = subMarkerPoses
	// create a new THREEx.ArMultiMarkerControls
	var multiMarkerControls = new THREEx.ArMultiMarkerControls(arToolkitContext, markerRoot, parameters)

	// return it
	return multiMarkerControls
}
var THREEx = THREEx || {}

THREEx.ArMultiMakersLearning = function(arToolkitContext, subMarkersControls){
	var _this = this
	this._arToolkitContext = arToolkitContext

	// Init variables
	this.subMarkersControls = subMarkersControls
	this.enabled = true

	// listen to arToolkitContext event 'sourceProcessed'
	// - after we fully processed one image, aka when we know all detected poses in it
	arToolkitContext.addEventListener('sourceProcessed', function(){
		_this._onSourceProcessed()
	})
}


//////////////////////////////////////////////////////////////////////////////
//		statistic collection
//////////////////////////////////////////////////////////////////////////////

/**
 * What to do when a image source is fully processed
 */
THREEx.ArMultiMakersLearning.prototype._onSourceProcessed = function(){
	var originQuaternion = this.subMarkersControls[0].object3d.quaternion
	// here collect the statistic on relative positioning

	// honor this.enabled
	if( this.enabled === false )	return

	// keep only the visible markers
	var visibleMarkerControls = this.subMarkersControls.filter(function(markerControls){
		return markerControls.object3d.visible === true
	})

	var count = Object.keys(visibleMarkerControls).length

	var positionDelta = new THREE.Vector3()
	var quaternionDelta = new THREE.Quaternion()
	var scaleDelta = new THREE.Vector3()
	var tmpMatrix = new THREE.Matrix4()

	// go thru all the visibleMarkerControls
	for(var i = 0; i < count; i++){
		var markerControls1 = visibleMarkerControls[i]
		for(var j = 0; j < count; j++){
			var markerControls2 = visibleMarkerControls[j]

			// if markerControls1 is markerControls2, then skip it
			if( i === j )	continue


			//////////////////////////////////////////////////////////////////////////////
			//		create data in markerControls1.object3d.userData if needed
			//////////////////////////////////////////////////////////////////////////////
			// create seenCouples for markerControls1 if needed
			if( markerControls1.object3d.userData.seenCouples === undefined ){
				markerControls1.object3d.userData.seenCouples = {}
			}
			var seenCouples = markerControls1.object3d.userData.seenCouples
			// create the multiMarkerPosition average if needed`
			if( seenCouples[markerControls2.id] === undefined ){
				// console.log('create seenCouples between', markerControls1.id, 'and', markerControls2.id)
				seenCouples[markerControls2.id] = {
					count : 0,
					position : {
						sum: new THREE.Vector3(0,0,0),
						average: new THREE.Vector3(0,0,0),
					},
					quaternion : {
						sum: new THREE.Quaternion(0,0,0,0),
						average: new THREE.Quaternion(0,0,0,0),
					},
					scale : {
						sum: new THREE.Vector3(0,0,0),
						average: new THREE.Vector3(0,0,0),
					},
				}
			}


			//////////////////////////////////////////////////////////////////////////////
			//		Compute markerControls2 position relative to markerControls1
			//////////////////////////////////////////////////////////////////////////////

			// compute markerControls2 position/quaternion/scale in relation with markerControls1
			tmpMatrix.getInverse(markerControls1.object3d.matrix)
			tmpMatrix.multiply(markerControls2.object3d.matrix)
			tmpMatrix.decompose(positionDelta, quaternionDelta, scaleDelta)

			//////////////////////////////////////////////////////////////////////////////
			//		update statistics
			//////////////////////////////////////////////////////////////////////////////
			var stats = seenCouples[markerControls2.id]
			// update the count
			stats.count++

			// update the average of position/rotation/scale
			THREEx.ArMultiMarkerControls.averageVector3(stats.position.sum, positionDelta, stats.count, stats.position.average)
			THREEx.ArMultiMarkerControls.averageQuaternion(stats.quaternion.sum, quaternionDelta, originQuaternion, stats.count, stats.quaternion.average)
			THREEx.ArMultiMarkerControls.averageVector3(stats.scale.sum, scaleDelta, stats.count, stats.scale.average)
		}
	}
}

//////////////////////////////////////////////////////////////////////////////
//		Compute markers transformation matrix from current stats
//////////////////////////////////////////////////////////////////////////////

THREEx.ArMultiMakersLearning.prototype.computeResult = function(){
	var _this = this
	var originSubControls = this.subMarkersControls[0]

	this.deleteResult()

	// special case of originSubControls averageMatrix
	originSubControls.object3d.userData.result = {
		averageMatrix : new THREE.Matrix4(),
		confidenceFactor: 1,
	}
	// TODO here check if the originSubControls has been seen at least once!!


	/**
	 * ALGO in pseudo code
	 *
	 * - Set confidenceFactor of origin sub markers as 1
	 *
	 * Start Looping
	 * - For a given sub marker, skip it if it already has a result.
	 * - if no result, check all seen couple and find n ones which has a progress of 1 or more.
	 * - So the other seen sub markers, got a valid transformation matrix.
	 * - So take local averages position/orientation/scale, compose a transformation matrix.
	 *   - aka transformation matrix from parent matrix * transf matrix pos/orientation/scale
	 * - Multiple it by the other seen marker matrix.
	 * - Loop on the array until one pass could not compute any new sub marker
	 */

	do{
		var resultChanged = false
		// loop over each subMarkerControls
		this.subMarkersControls.forEach(function(subMarkerControls){

			// if subMarkerControls already has a result, do nothing
			var result = subMarkerControls.object3d.userData.result
			var isLearned = (result !== undefined && result.confidenceFactor >= 1) ? true : false
			if( isLearned === true )	return

			// console.log('compute subMarkerControls', subMarkerControls.name())
			var otherSubControlsID = _this._getLearnedCoupleStats(subMarkerControls)
			if( otherSubControlsID === null ){
				// console.log('no learnedCoupleStats')
				return
			}

			var otherSubControls = _this._getSubMarkerControlsByID(otherSubControlsID)

			var seenCoupleStats = subMarkerControls.object3d.userData.seenCouples[otherSubControlsID]

			var averageMatrix = new THREE.Matrix4()
			averageMatrix.compose(seenCoupleStats.position.average, seenCoupleStats.quaternion.average, seenCoupleStats.scale.average)

			var otherAverageMatrix = otherSubControls.object3d.userData.result.averageMatrix

			var matrix = new THREE.Matrix4().getInverse(otherAverageMatrix).multiply(averageMatrix)
			matrix = new THREE.Matrix4().getInverse(matrix)

			console.assert( subMarkerControls.object3d.userData.result === undefined )
			subMarkerControls.object3d.userData.result = {
				averageMatrix: matrix,
				confidenceFactor: 1
			}

			resultChanged = true
		})
		// console.log('loop')
	}while(resultChanged === true)

	// debugger
	// console.log('json:', this.toJSON())
	// this.subMarkersControls.forEach(function(subMarkerControls){
	// 	var hasResult = subMarkerControls.object3d.userData.result !== undefined
	// 	console.log('marker', subMarkerControls.name(), hasResult ? 'has' : 'has NO', 'result')
	// })
}

//////////////////////////////////////////////////////////////////////////////
//		Utility function
//////////////////////////////////////////////////////////////////////////////

/**
 * get a _this.subMarkersControls id based on markerControls.id
 */
THREEx.ArMultiMakersLearning.prototype._getLearnedCoupleStats	= function(subMarkerControls){

	// if this subMarkerControls has never been seen with another subMarkerControls
	if( subMarkerControls.object3d.userData.seenCouples === undefined )	return null

	var seenCouples = subMarkerControls.object3d.userData.seenCouples
	var coupleControlsIDs = Object.keys(seenCouples).map(Number)

	for(var i = 0; i < coupleControlsIDs.length; i++){
		var otherSubControlsID = coupleControlsIDs[i]
		// get otherSubControls
		var otherSubControls = this._getSubMarkerControlsByID(otherSubControlsID)

		// if otherSubControls isnt learned, skip it
		var result = otherSubControls.object3d.userData.result
		var isLearned = (result !== undefined && result.confidenceFactor >= 1) ? true : false
		if( isLearned === false )	continue

		// return this seenCouplesStats
		return otherSubControlsID
	}

	// if none is found, return null
	return null
}

/**
 * get a _this.subMarkersControls based on markerControls.id
 */
THREEx.ArMultiMakersLearning.prototype._getSubMarkerControlsByID	= function(controlsID){

	for(var i = 0; i < this.subMarkersControls.length; i++){
		var subMarkerControls = this.subMarkersControls[i]
		if( subMarkerControls.id === controlsID ){
			return subMarkerControls
		}
	}

	return null
}
//////////////////////////////////////////////////////////////////////////////
//		JSON file building
//////////////////////////////////////////////////////////////////////////////

THREEx.ArMultiMakersLearning.prototype.toJSON = function(){

	// compute the average matrix before generating the file
	this.computeResult()

	//////////////////////////////////////////////////////////////////////////////
	//		actually build the json
	//////////////////////////////////////////////////////////////////////////////
	var data = {
		meta : {
			createdBy : "Area Learning - AR.js "+THREEx.ArToolkitContext.REVISION,
			createdAt : new Date().toJSON(),

		},
		trackingBackend: this._arToolkitContext.parameters.trackingBackend,
		subMarkersControls : [],
	}

	var originSubControls = this.subMarkersControls[0]
	var originMatrixInverse = new THREE.Matrix4().getInverse(originSubControls.object3d.matrix)
	this.subMarkersControls.forEach(function(subMarkerControls, index){

		// if a subMarkerControls has no result, ignore it
		if( subMarkerControls.object3d.userData.result === undefined )	return

		var poseMatrix = subMarkerControls.object3d.userData.result.averageMatrix
		console.assert(poseMatrix instanceof THREE.Matrix4)


		// build the info
		var info = {
			parameters : {
				// to fill ...
			},
			poseMatrix : poseMatrix.toArray(),
		}
		if( subMarkerControls.parameters.type === 'pattern' ){
			info.parameters.type = subMarkerControls.parameters.type
			info.parameters.patternUrl = subMarkerControls.parameters.patternUrl
		}else if( subMarkerControls.parameters.type === 'barcode' ){
			info.parameters.type = subMarkerControls.parameters.type
			info.parameters.barcodeValue = subMarkerControls.parameters.barcodeValue
		}else console.assert(false)

		data.subMarkersControls.push(info)
	})

	var strJSON = JSON.stringify(data, null, '\t');


	//////////////////////////////////////////////////////////////////////////////
	//		round matrix elements to ease readability - for debug
	//////////////////////////////////////////////////////////////////////////////
	var humanReadable = false
	if( humanReadable === true ){
		var tmp = JSON.parse(strJSON)
		tmp.subMarkersControls.forEach(function(markerControls){
			markerControls.poseMatrix = markerControls.poseMatrix.map(function(value){
				var roundingFactor = 100
				return Math.round(value*roundingFactor)/roundingFactor
			})
		})
		strJSON = JSON.stringify(tmp, null, '\t');
	}

	return strJSON;
}

//////////////////////////////////////////////////////////////////////////////
//		utility function
//////////////////////////////////////////////////////////////////////////////

/**
 * reset all collected statistics
 */
THREEx.ArMultiMakersLearning.prototype.resetStats = function(){
	this.deleteResult()

	this.subMarkersControls.forEach(function(markerControls){
		delete markerControls.object3d.userData.seenCouples
	})
}
/**
 * reset all collected statistics
 */
THREEx.ArMultiMakersLearning.prototype.deleteResult = function(){
	this.subMarkersControls.forEach(function(markerControls){
		delete markerControls.object3d.userData.result
	})
}
var THREEx = THREEx || {}

THREEx.ArMultiMarkerUtils = {}

//////////////////////////////////////////////////////////////////////////////
//		navigateToLearnerPage
//////////////////////////////////////////////////////////////////////////////

/**
 * Navigate to the multi-marker learner page
 *
 * @param {String} learnerBaseURL  - the base url for the learner
 * @param {String} trackingBackend - the tracking backend to use
 */
THREEx.ArMultiMarkerUtils.navigateToLearnerPage = function(learnerBaseURL, trackingBackend){
	var learnerParameters = {
		backURL : location.href,
		trackingBackend: trackingBackend,
		markersControlsParameters: THREEx.ArMultiMarkerUtils.createDefaultMarkersControlsParameters(trackingBackend),
	}
	location.href = learnerBaseURL + '#' + JSON.stringify(learnerParameters)
}

//////////////////////////////////////////////////////////////////////////////
//		DefaultMultiMarkerFile
//////////////////////////////////////////////////////////////////////////////

/**
 * Create and store a default multi-marker file
 *
 * @param {String} trackingBackend - the tracking backend to use
 */
THREEx.ArMultiMarkerUtils.storeDefaultMultiMarkerFile = function(trackingBackend){
	var file = THREEx.ArMultiMarkerUtils.createDefaultMultiMarkerFile(trackingBackend)
	// json.strinfy the value and store it in localStorage
	localStorage.setItem('ARjsMultiMarkerFile', JSON.stringify(file))
}



/**
 * Create a default multi-marker file
 * @param {String} trackingBackend - the tracking backend to use
 * @return {Object} - json object of the multi-marker file
 */
THREEx.ArMultiMarkerUtils.createDefaultMultiMarkerFile = function(trackingBackend){
	console.assert(trackingBackend)
	if( trackingBackend === undefined )	debugger
	// create the base file
	var file = {
		meta : {
			createdBy : "AR.js Default Marker "+THREEx.ArToolkitContext.REVISION,
			createdAt : new Date().toJSON(),
		},
		trackingBackend : trackingBackend,
		subMarkersControls : [
			// empty for now... being filled
		]
	}
	// add a subMarkersControls
	file.subMarkersControls[0] = {
		parameters: {},
		poseMatrix: new THREE.Matrix4().makeTranslation(0,0, 0).toArray(),
	}
	if( trackingBackend === 'artoolkit' ){
		file.subMarkersControls[0].parameters.type = 'pattern'
		file.subMarkersControls[0].parameters.patternUrl = THREEx.ArToolkitContext.baseURL + 'examples/marker-training/examples/pattern-files/pattern-hiro.patt'
	}else if( trackingBackend === 'aruco' ){
		file.subMarkersControls[0].parameters.type = 'barcode'
		file.subMarkersControls[0].parameters.barcodeValue = 1001
	}else console.assert(false)

	// json.strinfy the value and store it in localStorage
	return file
}

//////////////////////////////////////////////////////////////////////////////
//		createDefaultMarkersControlsParameters
//////////////////////////////////////////////////////////////////////////////

/**
 * Create a default controls parameters for the multi-marker learner
 *
 * @param {String} trackingBackend - the tracking backend to use
 * @return {Object} - json object containing the controls parameters
 */
THREEx.ArMultiMarkerUtils.createDefaultMarkersControlsParameters = function(trackingBackend){
	var link = document.createElement('a')
	link.href = THREEx.ArToolkitContext.baseURL
	var absoluteBaseURL = link.href
	if( trackingBackend === 'artoolkit' ){
		// pattern hiro/kanji/a/b/c/f
		var markersControlsParameters = [
			{
				type : 'pattern',
				patternUrl : absoluteBaseURL + 'examples/marker-training/examples/pattern-files/pattern-hiro.patt',
			},
			{
				type : 'pattern',
				patternUrl : absoluteBaseURL + 'examples/marker-training/examples/pattern-files/pattern-kanji.patt',
			},
			{
				type : 'pattern',
				patternUrl : absoluteBaseURL + 'examples/marker-training/examples/pattern-files/pattern-letterA.patt',
			},
			{
				type : 'pattern',
				patternUrl : absoluteBaseURL + 'examples/marker-training/examples/pattern-files/pattern-letterB.patt',
			},
			{
				type : 'pattern',
				patternUrl : absoluteBaseURL + 'examples/marker-training/examples/pattern-files/pattern-letterC.patt',
			},
			{
				type : 'pattern',
				patternUrl : absoluteBaseURL + 'examples/marker-training/examples/pattern-files/pattern-letterF.patt',
			},
		]
	}else if( trackingBackend === 'aruco' ){
		var markersControlsParameters = [
			{
				type : 'barcode',
				barcodeValue: 1001,
			},
			{
				type : 'barcode',
				barcodeValue: 1002,
			},
			{
				type : 'barcode',
				barcodeValue: 1003,
			},
			{
				type : 'barcode',
				barcodeValue: 1004,
			},
			{
				type : 'barcode',
				barcodeValue: 1005,
			},
			{
				type : 'barcode',
				barcodeValue: 1006,
			},
		]
	}else console.assert(false)
	return markersControlsParameters
}
//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

// to keep backward compatibility with deprecated code
// AFRAME.registerComponent('arjs', buildSystemParameter())
// AFRAME.registerComponent('artoolkit', buildSystemParameter())

// function buildSystemParameter(){ return {
// AFRAME.registerSystem('arjs', {
AFRAME.registerSystem('arjs', {
	schema: {
		trackingBackend : {
			type: 'string',
			default: 'artoolkit',
		},
		areaLearningButton : {
			type: 'boolean',
			default: true,
		},
		performanceProfile : {
			type: 'string',
			default: 'default',
		},

		// old parameters
		debug : {
			type: 'boolean',
			default: false
		},
		detectionMode : {
			type: 'string',
			default: '',
		},
		matrixCodeType : {
			type: 'string',
			default: '',
		},
		cameraParametersUrl : {
			type: 'string',
			default: '',
		},
		maxDetectionRate : {
			type: 'number',
			default: -1
		},
		sourceType : {
			type: 'string',
			default: '',
		},
		sourceUrl : {
			type: 'string',
			default: '',
		},
		sourceWidth : {
			type: 'number',
			default: -1
		},
		sourceHeight : {
			type: 'number',
			default: -1
		},
		displayWidth : {
			type: 'number',
			default: -1
		},
		displayHeight : {
			type: 'number',
			default: -1
		},
		canvasWidth : {
			type: 'number',
			default: -1
		},
		canvasHeight : {
			type: 'number',
			default: -1
		},
	},

	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////


	init: function () {
		var _this = this

		// setup artoolkitProfile
		var artoolkitProfile = new THREEx.ArToolkitProfile()
		artoolkitProfile.sourceWebcam()
		artoolkitProfile.trackingBackend(this.data.trackingBackend)
		artoolkitProfile.performance(this.data.performanceProfile)


		//////////////////////////////////////////////////////////////////////////////
		//		honor this.data
		//////////////////////////////////////////////////////////////////////////////

		// honor this.data and push what has been modified into artoolkitProfile
		if( this.data.debug !== false )			artoolkitProfile.contextParameters.debug = this.data.debug
		if( this.data.detectionMode !== '' )		artoolkitProfile.contextParameters.detectionMode = this.data.detectionMode
		if( this.data.matrixCodeType !== '' )		artoolkitProfile.contextParameters.matrixCodeType = this.data.matrixCodeType
		if( this.data.cameraParametersUrl !== '' )	artoolkitProfile.contextParameters.cameraParametersUrl = this.data.cameraParametersUrl
		if( this.data.maxDetectionRate !== -1 )		artoolkitProfile.contextParameters.maxDetectionRate = this.data.maxDetectionRate

		if( this.data.sourceType !== '' )		artoolkitProfile.contextParameters.sourceType = this.data.sourceType
		if( this.data.sourceUrl !== '' )		artoolkitProfile.contextParameters.sourceUrl = this.data.sourceUrl
		if( this.data.sourceWidth !== -1 )		artoolkitProfile.contextParameters.sourceWidth = this.data.sourceWidth
		if( this.data.sourceHeight !== -1 )		artoolkitProfile.contextParameters.sourceHeight = this.data.sourceHeight
		if( this.data.displayWidth !== -1 )		artoolkitProfile.contextParameters.displayWidth = this.data.displayWidth
		if( this.data.displayHeight !== -1 )		artoolkitProfile.contextParameters.displayHeight = this.data.displayHeight
		if( this.data.canvasWidth !== -1 )		artoolkitProfile.contextParameters.canvasWidth = this.data.canvasWidth
		if( this.data.canvasHeight !== -1 )		artoolkitProfile.contextParameters.canvasHeight = this.data.canvasHeight

		////////////////////////////////////////////////////////////////////////////////
		//          handle arToolkitSource
		////////////////////////////////////////////////////////////////////////////////

		var arToolkitSource = new THREEx.ArToolkitSource(artoolkitProfile.sourceParameters)
		this.arToolkitSource = arToolkitSource
		arToolkitSource.init(function onReady(){
			// handle resize of renderer
			onResize()

// TODO this is crappy - code an exponential backoff - max 1 seconds
			// kludge to write a 'resize' event
			var startedAt = Date.now()
			var timerId = setInterval(function(){
				if( Date.now() - startedAt > 10*1000 ){
					clearInterval(timerId)
					return
				}
				// onResize()
				window.dispatchEvent(new Event('resize'));
			}, 1000/30)
		})

		// handle resize
		window.addEventListener('resize', onResize)
		function onResize(){
			// ugly kludge to get resize on aframe... not even sure it works
			arToolkitSource.onResizeElement()
			arToolkitSource.copyElementSizeTo(document.body)

			var buttonElement = document.querySelector('.a-enter-vr')
			if( buttonElement ){
				buttonElement.style.position = 'fixed'
			}
		}
		////////////////////////////////////////////////////////////////////////////////
		//          initialize arToolkitContext
		////////////////////////////////////////////////////////////////////////////////
		// create atToolkitContext
		var arToolkitContext = new THREEx.ArToolkitContext(artoolkitProfile.contextParameters)
		this.arToolkitContext = arToolkitContext
		// initialize it
		arToolkitContext.init(function onCompleted(){
			// // copy projection matrix to camera
			// var projectionMatrixArr = arToolkitContext.arController.getCameraMatrix();
			// _this.sceneEl.camera.projectionMatrix.fromArray(projprojectionMatrixArrectionMatrix);
		})

		//////////////////////////////////////////////////////////////////////////////
		//		area learning
		//////////////////////////////////////////////////////////////////////////////

		// export function to navigateToLearnerPage
		this.navigateToLearnerPage = function(){
			var learnerURL = THREEx.ArToolkitContext.baseURL + 'examples/multi-markers/examples/learner.html'
			THREEx.ArMultiMarkerUtils.navigateToLearnerPage(learnerURL, _this.data.trackingBackend)
		}

		// export function to initAreaLearningButton
		this.initAreaLearningButton = function(){
			// honor arjsSystem.data.areaLearningButton
			if( this.data.areaLearningButton === false )	return

			// if there is already a button, do nothing
			if( document.querySelector('#arjsAreaLearningButton') !== null )	return

			// create the img
			var imgElement = document.createElement('img')
			imgElement.id = 'arjsAreaLearningButton'
			imgElement.style.position = 'fixed'
			imgElement.style.bottom = '16px'
			imgElement.style.left = '16px'
			imgElement.style.width = '48px'
			imgElement.style.height = '48px'
			imgElement.style.zIndex = 1
			imgElement.src = THREEx.ArToolkitContext.baseURL + "examples/multi-markers/examples/images/record-start.png"
			document.body.appendChild(imgElement)
			imgElement.addEventListener('click', function(){
				_this.navigateToLearnerPage()
			})
		}

		//console.log('JSON ...');






	},

	tick : function(now, delta){
		if( this.arToolkitSource.ready === false )	return

		// copy projection matrix to camera
		if( this.arToolkitContext.arController !== null ){
			this.el.sceneEl.camera.projectionMatrix.copy( this.arToolkitContext.getProjectionMatrix() );
		}

		this.arToolkitContext.update( this.arToolkitSource.domElement )
	},
})



function generatePresets(data)
{
	switch(data.preset)
	{
		case 'area':
			data.type = 'area'
			break;

		default:
			var pattern = patterns.filter(x => x.pattern == data.preset);
			pattern		= pattern[0];

			//console.log('data.preset ',data.preset)
			//console.log('PATTERN ',pattern)

			data.type = pattern.type;
			data.patternUrl = pattern.patternUrl;

			break;


	}


	//console.log('json ',data);
	return data;


	switch(data.preset)
	{

		case 'walmart':
			data.type = 'pattern'
			data.patternUrl = 'markers/walmart.patt'
			break;

		case 'news':
			data.type = 'pattern'
			data.patternUrl = 'markers/news.patt'
			break;

		case 'events':
			data.type = 'pattern'
			data.patternUrl = 'markers/events.patt'
			break;

		case 'area':
			data.type = 'area'
			break;

		default:
			//console.log('*/*/*/*/*/*/*/*/*/*DEFAULT')
			console.assert( data.preset === '', 'illegal preset value '+data.preset)
			break;


	}

	//console.log('data switch',data)

	return data;




}

//////////////////////////////////////////////////////////////////////////////
//		arjsmarker
//////////////////////////////////////////////////////////////////////////////
AFRAME.registerComponent('arjsmarker', {
	dependencies: ['arjs', 'artoolkit'],
	schema: {
		preset: {
			type: 'string',
		},
		markerhelpers : {	// IIF preset === 'area'
			type: 'boolean',
			default: false,
		},

		// controls parameters
		size: {
			type: 'number',
			default: 1
		},
		type: {
			type: 'string',
		},
		patternUrl: {
			type: 'string',
		},
		barcodeValue: {
			type: 'number'
		},
		changeMatrixMode: {
			type: 'string',
			default : 'modelViewMatrix',
		},
		minConfidence: {
			type: 'number',
			default: 0.6,
		},
	},
	init: function () {
		var _this = this;

		// actually init arMarkerControls
		var arjsSystem = this.el.sceneEl.systems.arjs || this.el.sceneEl.systems.artoolkit;

		var artoolkitContext = arjsSystem.arToolkitContext;
		var scene = this.el.sceneEl.object3D;

		this.data = generatePresets(this.data);

		// build a smoothedControls
		this._markerRoot = new THREE.Group()
		scene.add(this._markerRoot)

		this._arMarkerControls = null
		this._multiMarkerControls = null

		// create the controls
		//console.log(this.data.type)
		if( this.data.type === 'area' ){
			// if no localStorage.ARjsMultiMarkerFile, then write one with default marker
			if( localStorage.getItem('ARjsMultiMarkerFile') === null ){
				THREEx.ArMultiMarkerUtils.storeDefaultMultiMarkerFile(arjsSystem.data.trackingBackend)
			}

			// get multiMarkerFile from localStorage
			console.assert( localStorage.getItem('ARjsMultiMarkerFile') !== null )
			var multiMarkerFile = localStorage.getItem('ARjsMultiMarkerFile')

			// create ArMultiMarkerControls
			this._multiMarkerControls = THREEx.ArMultiMarkerControls.fromJSON(artoolkitContext, scene, this._markerRoot, multiMarkerFile, {
				changeMatrixMode : this.data.changeMatrixMode
			})
			console.log('this.data.markerhelpers', this.data.markerhelpers)
			// display THREEx.ArMarkerHelper if needed - useful to debug
			if( this.data.markerhelpers === true ){
				this._multiMarkerControls.subMarkersControls.forEach(function(subMarkerControls){
					// add an helper to visuable each sub-marker
					var markerHelper = new THREEx.ArMarkerHelper(subMarkerControls)
					scene.add( markerHelper.object3d )
				})
			}
		}else if( this.data.type === 'pattern' || this.data.type === 'barcode' || this.data.type === 'unknown' )
		{
			this._arMarkerControls = new THREEx.ArMarkerControls(artoolkitContext, this._markerRoot, this.data)
		}
		else
		{

			console.log(false)
		}

		// build a smoothedControls
		this.arSmoothedControls = new THREEx.ArSmoothedControls(this.el.object3D)



		// honor arjsSystem.data.areaLearningButton
		if( this.data.type === 'area' )	arjsSystem.initAreaLearningButton()
	},
	remove : function(){
		// this._arMarkerControls.dispose()
	},
	update: function () {
		// FIXME this mean to change the recode in trackBarcodeMarkerId ?
		// var markerRoot = this.el.object3D;
		// markerRoot.userData.size = this.data.size;
	},
	tick: function(){
		if( this.data.changeMatrixMode === 'cameraTransformMatrix' ){
			this.el.sceneEl.object3D.visible = this.el.object3D.visible;
		}
		if( this._multiMarkerControls !== null ){
			// update smoothedControls parameters depending on how many markers are visible in multiMarkerControls
			this._multiMarkerControls.updateSmoothedControls(this.arSmoothedControls)
		}

		// update smoothedControls position
		this.arSmoothedControls.update(this._markerRoot)
	}
});

//////////////////////////////////////////////////////////////////////////////
//                define some primitives shortcuts
//////////////////////////////////////////////////////////////////////////////

AFRAME.registerPrimitive('a-marker', AFRAME.utils.extendDeep({}, AFRAME.primitives.getMeshMixin(), {
	defaultComponents: {
		'arjsmarker': {},
	},
	mappings: {
		'type': 'arjsmarker.type',
		'size': 'arjsmarker.size',
		'url': 'arjsmarker.patternUrl',
		'value': 'arjsmarker.barcodeValue',
		'preset': 'arjsmarker.preset',
		'minConfidence': 'arjsmarker.minConfidence',
		'markerhelpers': 'arjsmarker.markerhelpers',
	}
}));

AFRAME.registerPrimitive('a-marker-camera', AFRAME.utils.extendDeep({}, AFRAME.primitives.getMeshMixin(), {
	defaultComponents: {
		'arjsmarker': {
			changeMatrixMode: 'cameraTransformMatrix'
		},
		'camera': true,
	},
	mappings: {
		'type': 'arjsmarker.type',
		'size': 'arjsmarker.size',
		'url': 'arjsmarker.patternUrl',
		'value': 'arjsmarker.barcodeValue',
		'preset': 'arjsmarker.preset',
		'minConfidence': 'arjsmarker.minConfidence',
		'markerhelpers': 'arjsmarker.markerhelpers',
	}
}));

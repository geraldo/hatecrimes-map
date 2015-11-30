var categories = [];
var markers = new L.MarkerClusterGroup({spiderfyDistanceMultiplier: 2.2, maxClusterRadius: 40, disableClusteringAtZoom: 12});
var markers2 = new L.LayerGroup();
var colors = {"Antisemitismo": "#874321", "Aporofobia": "#80a51f", "Homofobia": "#5e457b", "Intolerancia criminal": "#4cbb81", "Islamofobia": "#b5bb83", "Disfobia": "#fab909", "Odio ideológico": "#ee229c", "Racismo, xenofobia": "#761c2c", "Romafobia": "#2f2d66", "Transfobia": "#273d08", "Violencia ultra fútbol": "#941a59"};

/* main map */
var map = L.map('map').setView([40.0758302,-1], 6);
map.once('focus', function() { map.scrollWheelZoom.enable(); });

L.tileLayer('https://{s}.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={token}', {
	minZoom: 6,
	maxZoom: 18,
	id: 'gkogler.l91ko9dl',
	token: 'pk.eyJ1IjoiZ2tvZ2xlciIsImEiOiJSQ1Nld2NrIn0.yW2DR2Lp2NS1xPJsOddW9Q'
}).addTo(this.map);

/* canary island map */
var map2 = L.map('map2', { zoomControl:false }).setView([28.1, -15.4], 6);

L.tileLayer('https://{s}.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={token}', {
	maxZoom: 6,
	minZoom: 6,
	id: 'gkogler.l91ko9dl',
	token: 'pk.eyJ1IjoiZ2tvZ2xlciIsImEiOiJSQ1Nld2NrIn0.yW2DR2Lp2NS1xPJsOddW9Q'
}).addTo(this.map2);

// Fetch, process and display geoJSON.
jQuery.when(
	jQuery.getJSON("http://crimenesdeodio.info/wp-content/export/hatecrimes.js", {})   
	//jQuery.getJSON("./hatecrimes.js", {})   
	.done (function( hatecrimes ) {

		loadRegisters(hatecrimes.features);
		//loadSlider(hatecrimes.features)
		initFilter();

	})
    .fail(function(hatecrimes) {    
      console.log("json error");
    })
).then(function() { 
	console.log("json loaded!");
});

function loadRegisters(json) {
	for (key in json) {
		var register = json[key].properties;
		register.longitude = json[key].geometry.coordinates[0];
		register.latitude = json[key].geometry.coordinates[1];
		//console.log(register);

		// load categoria object
		var catTitle = register.category.trim().split(",");
		var cat;

		if( Object.prototype.toString.call( catTitle ) === '[object Array]' ) {
		    catTitle.forEach(function (category, index) {
		    	cat = registerCategory(category.trim());
		    });
		} else {
			cat = registerCategory(catTitle);
		}

		//create marker for register
		if (isNumber(register.latitude) && isNumber(register.longitude)) {
			var date = dateFormat(register.date, "d 'de' mmmm yyyy");
			register.year = dateFormat(register.date, "yyyy");

			var popupText = "<h2>"+register.title+"<br>"+date+"<br>"+register.city+"</h2>";

			var desc = register.description;
			desc = desc.substr(0, 400);
			desc = register.description.substr(0, Math.min(desc.length, desc.lastIndexOf(". ")+1));
			popupText += "<p>"+desc+"</p>";
			popupText += "<p><strong>Tipología:</strong> "+register.category+'</p>';
			popupText += "<p><a target='_parent' href='http://crimenesdeodio.info/index.php?p="+register.id+"'>más información</a></p>";

			/*var marker = L.circleMarker(new L.LatLng( register.latitude, register.longitude ), {
				radius: 8,
				color: cat.color,
				fillColor: cat.color,
				weight: 1,
				opacity: 1,
				fillOpacity: 0.8
			});*/
			var marker = L.marker(new L.LatLng( register.latitude, register.longitude ), {
				icon: cat.icon,
				title: register.title
			});
			marker.bindPopup(popupText);
			console.log("Add register "+register.title);

			// save marker to layers
			cat.layer.addLayer(marker);
			markers.addLayer(marker);

			// canary islands
			if (register.longitude < -10) {
				var popupText = "<h2>"+register.title+"<br>"+date+"<br>"+register.city+"</h2>";
				popupText += "<p><a target='_parent' href='http://crimenesdeodio.info/index.php?p="+register.id+"'>más información</a></p>";

				/*var marker = L.circleMarker(new L.LatLng( register.latitude, register.longitude ), {
					radius: 8,
					color: cat.color,
					fillColor: cat.color,
					weight: 1,
					opacity: 1,
					fillOpacity: 0.8
				});*/
				var marker = L.marker(new L.LatLng( register.latitude, register.longitude ), {
					icon: cat.icon,
					title: register.title
				});
				marker.bindPopup(popupText);
				markers2.addLayer(marker);
			}
		}
		else {
			console.log("WARNING! latitude or longitude contains error, can't show this place: ["+register.id+"] "+register.title+" | cat:"+register.category);
		}			

	}
	map.addLayer(markers);
	map2.addLayer(markers2);
}

function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// get category object by category name
function getCat(cat) {
    for (var i = 0, len = categories.length; i < len; i++) {
        if (categories[i].title === cat)
            return categories[i];
    }
    return null;
}

function registerCategory(catTitle) {
	cat = getCat(catTitle);

	if (cat == null) {
		//create new category
		console.log("Add category "+catTitle);
		cat = {
			title: catTitle,
			color: colors[catTitle],
			layer: new L.LayerGroup(),
			icon: new L.icon({
				iconUrl: '/wp-content/plugins/hatecrimes-map/images/'+catTitle+'.png',
				iconSize:     [24, 32],
				iconAnchor:   [12, 16],
				popupAnchor:  [0, -16],
				color: colors[catTitle]
			})
		};
		categories.push(cat);
	}

	return cat;
}

function isNumber(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+jQuery/g;
String.prototype.trim = function() {
	return this.replace(rtrim, '');
};

/**************
 filter 
 **************/
function initFilter() {
	//jQuerycategories = get_terms( "type", "hatecrime" );
	/*var categories = {
		antisemitismo: { title: "Antisemitismo" },
		aporofobia: { title: "Aporofobia" },
		futbol: { title: "Futbol" },
		homofobia: { title: "Homofobia" },
		islamofobia: { title: "Islamofobia" },
		minusvalido: { title: "Minusvalido" },
		odioideologico: { title: "Odio ideológico" },
		racismoxenofobia: { title: "Racismo/Xenofobia" },
		romafobia: { title: "Romafobia" },
		transfobia: { title: "Transfobia" }
	}*/

	categories.forEach(function(cat, i){
		console.log("Add category "+cat.title);
		jQuery('#filter').append('<input class="cb cb-cat" id="cb-cat-'+cat.id+'" type="checkbox" value="'+cat.title+'" checked="checked"><span style="color:#fff;background-color:'+cat.color+'">'+cat.title+'</span></br>');
	});

	//add feminicidio & antisemitismo
	jQuery('#filter').append('<a target="_blank" href="http://www.informeraxen.es/tag/antisemitismo/" class="cb cb-cat" style="color:#fff;background-color:#874321;margin-left:21px;">Antisemitismo</a></br>');
	jQuery('#filter').append('<a target="_blank" href="http://www.feminicidio.net/menu-feminicidio-informes-y-cifras" class="cb cb-cat" style="color:#fff;background-color:#a00;margin-left:21px;">Misoginia</a></br></br>');

	// category changed
	jQuery('.cb-cat').on('change', function(e) {
		var id = jQuery(this).attr('id');
		var cb = '';
		if (jQuery(this).is(':checked')) cb = 'checked';
		//select subcats
		jQuery('.'+id).prop('checked', cb);
		
		showCats();
	});

	jQuery('#filter').append('<p><button type="button" onclick="showAll();">Todos</button> <button type="button" onclick="showNone();">Ninguno</button></p>');
}

function showCats() {
	var cats=new Array();
	jQuery('#filter input:checked').each(function(){
		cats.push(jQuery(this).val());
	});
	showCat(cats);
}

// show all layers
function showAll() {
	jQuery('#filter').find(':checkbox').prop('checked', 'checked');
	markers.clearLayers();
	categories.forEach(function(obj,index){
		markers.addLayer(categories[index].layer);
	});
}

// hide all layers
function showNone() {
	jQuery('#filter').find(':checkbox').prop('checked', '');
	markers.clearLayers();
}

// show only this category
function showCat(cats) {
	markers.clearLayers();
	cats.forEach(function(cat,i){
		categories.forEach(function(obj,j){
			if (obj.title === cat) {
				markers.addLayer(obj.layer);
			}
		});
	});
}
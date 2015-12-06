var categories = [];
var markers = new L.MarkerClusterGroup({spiderfyDistanceMultiplier: 2.2, maxClusterRadius: 40, disableClusteringAtZoom: 12});
var markers2 = new L.LayerGroup();
var colors = {"antisemitismo": "#874321", "aporofobia": "#80a51f", "homofobia": "#5e457b", "intolerancia-criminal": "#4cbb81", "islamofobia": "#b5bb83", "disfobia": "#fab909", "odioideologico": "#ee229c", "racismoxenofobia": "#761c2c", "romafobia": "#2f2d66", "transfobia": "#273d08", "futbol": "#941a59"};
var id = 'gkogler.l91ko9dl';
var token = 'pk.eyJ1IjoiZ2tvZ2xlciIsImEiOiJSQ1Nld2NrIn0.yW2DR2Lp2NS1xPJsOddW9Q';
var lang = getLang();

/* main map */
var map = L.map('map').setView([40.0758302,-1], 6);
map.once('focus', function() { map.scrollWheelZoom.enable(); });

L.tileLayer('https://{s}.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={token}', {
	minZoom: 5,
	maxZoom: 18,
	id: id,
	token: token
}).addTo(this.map);

/* canary island map */
var map2 = L.map('map2', { zoomControl:false }).setView([28.1, -15.4], 5);

L.tileLayer('https://{s}.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={token}', {
	maxZoom: 5,
	minZoom: 5,
	id: id,
	token: token
}).addTo(this.map2);

// Fetch, process and display geoJSON.
jQuery.when(
	jQuery.getJSON("/getjson", {})   
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
		var catSlug = register.catSlug.trim().split(",");
		var cats = new Array();

		if( Object.prototype.toString.call( catSlug ) === '[object Array]' ) {
		    catSlug.forEach(function (category, index) {
		    	cats.push(registerCategory(catTitle[index].trim(), category.trim()));
		    });
		} else {
			cats.push(registerCategory(catTitle.trim(), catSlug.trim()));
		}

		//create marker for register
		if (isNumber(register.latitude) && isNumber(register.longitude)) {
			var date = dateFormat(register.date, "d 'de' mmmm yyyy");
			register.year = dateFormat(register.date, "yyyy");

			var popupText = "<h2>"+register.title+".<br>"+date+".<br>"+register.city+"</h2>";

			var desc = register.description;
			desc = desc.substr(0, 400);
			desc = register.description.substr(0, Math.min(desc.length, desc.lastIndexOf(". ")+1));
			popupText += "<p>"+desc+"</p>";
			popupText += "<p><strong>"+getLangString("type")+":</strong> "+register.category+'</p>';
			popupText += "<p><a target='_parent' href='/index.php?p="+register.id+"'>"+getLangString("more")+"</a></p>";

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
			//console.log("Add register ", register);

			// save marker to layers
			cats.forEach(function (category, index) {
				category.layer.addLayer(marker);
			});
			markers.addLayer(marker);

			// canary islands
			if (register.longitude < -10) {
				var popupText = "<h2>"+register.title+".<br>"+date+".<br>"+register.city+"</h2>";
				popupText += "<p><a href='/index.php?p="+register.id+"'>"+getLangString("more")+"</a></p>";

				/*var marker = L.circleMarker(new L.LatLng( register.latitude, register.longitude ), {
					radius: 8,
					color: cat.color,
					fillColor: cat.color,
					weight: 1,
					opacity: 1,
					fillOpacity: 0.8
				});*/
				var marker = L.marker(new L.LatLng( register.latitude, register.longitude ), {
					icon: cats[0].icon,
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
        if (categories[i].slug === cat)
            return categories[i];
    }
    return null;
}

function registerCategory(catTitle, catSlug) {
	cat = getCat(catSlug);

	if (cat == null) {
		//create new category
		//console.log("Add category: "+catTitle+" ["+catSlug+"]");
		cat = {
			title: catTitle,
			slug: catSlug,
			color: colors[catSlug],
			layer: new L.LayerGroup(),
			icon: new L.icon({
				iconUrl: '/wp-content/plugins/hatecrimes-map/images/'+catSlug+'.png',
				iconSize:     [24, 32],
				iconAnchor:   [12, 16],
				popupAnchor:  [0, -16],
				color: colors[catSlug]
			})
		};
		categories.push(cat);
	}

	return cat;
}

/**************
 filter 
 **************/
function initFilter() {
	//categories.sortOn("title");
	categories.sort(sortOn("title"));

	categories.forEach(function(cat, i){
		jQuery('#filter').append('<input class="cb cb-cat" id="cb-cat-'+cat.id+'" type="checkbox" value="'+cat.slug+'" checked="checked"><span style="color:#fff;background-color:'+cat.color+'">'+cat.title+'</span></br>');
	});

	//add feminicidio & antisemitismo
	jQuery('#filter').append('<a target="_blank" href="http://www.informeraxen.es/tag/antisemitismo/" class="cb cb-cat" style="color:#fff;background-color:#874321;margin-left:21px;">'+getLangString("Antisemitism")+'</a></br>');
	jQuery('#filter').append('<a target="_blank" href="http://www.feminicidio.net/menu-feminicidio-informes-y-cifras" class="cb cb-cat" style="color:#fff;background-color:#a00;margin-left:21px;">'+getLangString("Misogyny")+'</a></br></br>');

	// category changed
	jQuery('.cb-cat').on('change', function(e) {
		var id = jQuery(this).attr('id');
		var cb = '';
		if (jQuery(this).is(':checked')) cb = 'checked';
		//select subcats
		jQuery('.'+id).prop('checked', cb);
		
		showCats();
	});

	jQuery('#filter').append('<p><button type="button" onclick="showAll();">'+getLangString('All')+'</button> <button type="button" onclick="showNone();">'+getLangString('None')+'</button></p>');
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
			//console.log(obj.slug, cat);
			if (obj.slug === cat) {
				markers.addLayer(obj.layer);
			}
		});
	});
}

/**************
 help functions 
 **************/
function isNumber(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+jQuery/g;
String.prototype.trim = function() {
	return this.replace(rtrim, '');
}

// http://stackoverflow.com/questions/16648076/sort-array-on-key-value#16648532
/*Array.prototype.sortOn = function(key){
    this.sort(function(a, b){
        if(a[key] < b[key]){
            return -1;
        }else if(a[key] > b[key]){
            return 1;
        }
        return 0;
    });
}*/

function sortOn(key) {
  return function(a,b){
   if (a[key] > b[key]) return 1;
   if (a[key] < b[key]) return -1;
   return 0;
  }
}

//get language from URL
function getLang() {
	var language = "es";
	var loc = window.location.href;
	var url = "crimenesdeodio.info"
	var pos1 = loc.indexOf(url);
	loc = loc.substring(pos1+url.length+1);
	loc = loc.split("/");
	if (loc[0] == "en" || loc[0] == "ca") {
		language = loc[0];
	}
	return language;
}

function getLangString(str) {
	if (lang == "en") {
		return str;
	} else {
		return translations[str][lang];
	}
}

var translations = {
	"All": {
		"es": "Todos",
		"ca": "Tots" 
	},
	"None": {
		"es": "Ninguno",
		"ca": "Ningú" 
	},
	"more": {
		"es": "más información",
		"ca": "mes informació"
	},
	"type": {
		"es": "Tipología",
		"ca": "Tipologia"
	},
	"Antisemitism": {
		"es": "Antisemitismo",
		"ca": "Antisemitisme"
	},
	"Misogyny": {
		"es": "Misoginia",
		"ca": "Misogínia"
	}
}
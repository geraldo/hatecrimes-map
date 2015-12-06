<?php
/*
Plugin Name: Hate Crime Map
Description: Map for Hate Crime plugin for crimenesdelodio.info project
Author: Gerald Kogler
Author URI: http://go.yuri.at
Text Domain: hatecrimes
*/

//if (is_page_template("map-template.php")) {
	wp_enqueue_style('leaflet-css', plugins_url('/lib/leaflet.css', __FILE__ ));
	wp_enqueue_style('map-css', plugins_url('/style.css', __FILE__ ));
	wp_enqueue_style('markercluster-css', plugins_url('/lib/MarkerCluster.css', __FILE__ ));
	wp_enqueue_style('markercluster-default-css', plugins_url('/lib/MarkerCluster.Default.css', __FILE__ ));
	//wp_enqueue_script('leaflet-js', plugins_url('/lib/leaflet.js', __FILE__ ));
	//wp_enqueue_script('leaflet-markercluster-js', plugins_url('/lib/leaflet.markercluster.js', __FILE__ ));
	//wp_enqueue_script('date-js', plugins_url('/lib/date.format.js', __FILE__ ));
	//wp_enqueue_script('map-js', plugins_url('/map.js', __FILE__ ));
//}

?>
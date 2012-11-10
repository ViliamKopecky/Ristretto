<?php

use Nette\Utils\Neon;
use Nette\Utils\Finder;
use Nette\Templating\FileTemplate;

function importModel($filetype, $parse_function) {
	$model = array();
	foreach (Finder::findFiles('*.'.$filetype)->in(MODEL_DIR) as $path => $file) {
		$parts = explode(DIRECTORY_SEPARATOR, $path);
		$file_parts = explode('.', array_pop($parts));
		$model_name = array_shift($file_parts);
		$model[$model_name] = $parse_function(file_get_contents('safe://' . $path));
	}
	return $model;
}

$json = importModel('json', function($str) {
	return json_decode($str);
});

$neon = importModel('neon', function($str) {
	$neon = new Neon();
	return $neon->decode($str);
});

$model = json_decode(json_encode($json + $neon));

$file = TEMPLATES_DIR . '/' . $argv[1] . '.latte';

if(!file_exists($file)) {
	$file = TEMPLATES_DIR . '/404.latte';
}

if(file_exists($file)) {
	$template = new FileTemplate($file);

	$template->registerHelperLoader('Nette\Templating\Helpers::loader');

	$template->onPrepareFilters[] = function($template) {
	    $template->registerFilter(new Nette\Latte\Engine);
	};

	$template->model = $model;

	$template->render();
} else {
	echo "no file yet";
}


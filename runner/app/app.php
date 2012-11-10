<?php

use Nette\Utils\Neon;
use Nette\Utils\Finder;
use Nette\Templating\FileTemplate;

$modelDir = $context->parameters["modelDir"];
$templatesDir = $context->parameters["templatesDir"];

function importModel($filetype, $dir, $parse_function) {
	$model = array();
	foreach (Finder::findFiles('*.'.$filetype)->in($dir) as $path => $file) {
		$parts = explode(DIRECTORY_SEPARATOR, $path);
		$file_parts = explode('.', array_pop($parts));
		$model_name = array_shift($file_parts);
		$model[$model_name] = $parse_function(file_get_contents('safe://' . $path));
	}
	return $model;
}

$json = importModel('json', $modelDir, function($str) {
	return json_decode($str);
});

$neon = importModel('neon', $modelDir, function($str) {
	$neon = new Neon();
	return $neon->decode($str);
});

$model = json_decode(json_encode($json + $neon));

$filename = $argv[1];
$file = $templatesDir . "/$filename.latte";

if(!file_exists($file)) {
	$file = $templatesDir . '/404.latte';
}

if(file_exists($file)) {
	$template = new FileTemplate($file);

	$template->registerHelperLoader('Nette\Templating\Helpers::loader');
	$template->onPrepareFilters[] = function($template) {
	    $template->registerFilter(new Nette\Latte\Engine);
	};

	$template->context = $context;
	$template->model = $model;
	
	$template->render();
} else {
	echo "<h1 style='font-family:sans-serif;text-align:center'>Welcome to <a href='https://github.com/ViliamKopecky/Mixturette'>Mixturette</a></h1>";
}


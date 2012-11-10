<?php

use Nette\Utils\Neon;
use Nette\Utils\Finder;
use Nette\Templating\FileTemplate;

$neon = new Neon();

$model = array();

foreach (Finder::findFiles('*.json')->in(MODEL_DIR) as $path => $file) {
	$parts = explode(DIRECTORY_SEPARATOR, $path);
	$file_parts = explode('.', array_pop($parts));
	$model_name = array_shift($file_parts);
	$model[$model_name] = json_decode(file_get_contents('safe://' . $path));
}
foreach (Finder::findFiles('*.neon')->in(MODEL_DIR) as $path => $file) {
	$parts = explode(DIRECTORY_SEPARATOR, $path);
	$file_parts = explode('.', array_pop($parts));
	$model_name = array_shift($file_parts);
	$model[$model_name] = $neon->decode(file_get_contents('safe://' . $path));
}
$model = json_decode(json_encode($model));

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


<?php

use Nette\Utils\Neon;
use Nette\Utils\Finder;
use Nette\Utils\Strings;
use Nette\Templating\FileTemplate;

$modelDir = realpath($context->parameters["modelDir"]);
$templatesDir = realpath($context->parameters["templatesDir"]);

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

// convert multidimensional array to stdClasses
$model = json_decode(json_encode($json + $neon));

$filename = $argv[1];
$file = $templatesDir . "/$filename.latte";

if(!file_exists($file)) {
	$file = $templatesDir . '/404.latte';
}

if(file_exists($file)) {
	$template = new FileTemplate($file);

	$template->registerHelperLoader('Nette\Templating\Helpers::loader');
	$template->registerFilter(new Nette\Latte\Engine);

	$template->context = $context;
	$template->model = $model;
	
	$template->render();
} else {
	echo "<div style='font-family:sans-serif;text-align:center;line-height:150%;margin-top:30px;'>";
	echo "<h1>Welcome to <a href='https://github.com/ViliamKopecky/Mixturette'>Mixturette</a></h1>";
	foreach (Finder::findFiles('*.latte')->in($templatesDir) as $path => $file) {
		$filename = $file->getFilename();
		if(substr($filename, 0, 1) !== '@') {
			$relativePath = str_replace($templatesDir, '', $path);
			$relativePath = str_replace(DIRECTORY_SEPARATOR, '/', $relativePath);
			$relativePath = str_replace('.latte', '', $relativePath);
			echo "<a href='$relativePath'>$filename</a><br>";
		}
	}
	echo "</div>";
}

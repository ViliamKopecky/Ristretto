<?php

use Nette\Utils\Neon;
use Nette\Utils\Finder;
use Nette\Utils\Strings;
use Nette\Templating\FileTemplate;

$modelDir = realpath($config->model_dir);
$latteDir = realpath($config->latte_dir);

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
$file = $latteDir . "/$filename.latte";

if(!file_exists($file)) {
	$file = $latteDir . '/404.latte';
}

$list = false;
if(!file_exists($file)) {
	$list = true;
	$file = __DIR__ . '/latte/list.latte';
}

if(file_exists($file)) {
	$template = new FileTemplate($file);

	$template->registerHelperLoader('Nette\Templating\Helpers::loader');
	$template->registerFilter(new Nette\Latte\Engine);

	$texy = new \Texy();

	$template->registerHelper('texy', function ($s) use ($texy) {
		return $texy->process($s);
	});

	$template->registerHelper('texyline', function ($s) use ($texy) {
		return $texy->processLine($s);
	});

	$template->config = $config;
	$template->model = $model;


	if($list) {
		$lattes = array();
		foreach (Finder::findFiles('*.latte')->from($latteDir) as $path => $file) {

			$url = str_replace($latteDir, '', $path);
			$name = $url = str_replace(DIRECTORY_SEPARATOR, '/', $url);

			$url = str_replace('.latte', '', $url);
			
			$parts = explode('/', $url);
			$last = array_pop($parts);

			if($last === 'index') {
				$url = implode('/', $parts);
				if(empty($url))
					$url = '/';
			}

			if(substr($file->getFilename(), 0, 1) === '@') {
				$url = false;
			}

			$name = substr($name, 1);
			$lattes[$name] = $url;
		}
		$template->lattes = $lattes;
	}


	$template->render();
} else {
	echo "No template.";
}

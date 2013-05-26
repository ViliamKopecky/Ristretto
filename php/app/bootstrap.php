<?php

$options = json_decode($argv[2]);

$now = new DateTime();

require __DIR__ . '/update_composer.php';
require __DIR__ . '/../libs/autoload.php';

use Nette\Utils\Neon,
	Nette\Utils\Finder,
	Nette\Utils\Strings;

function error($message) {
	fwrite(STDERR, $message);
	exit(1);
}

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

$configurator = new Nette\Config\Configurator;

$configurator->setDebugMode($configurator::DEVELOPMENT);

$log_dir = $options->temp_dir . '/log';
$temp_dir = $options->temp_dir .'/temp';

if(!file_exists($log_dir)) {
	mkdir($log_dir);
}
if(!file_exists($temp_dir)) {
	mkdir($temp_dir);
}

$configurator->enableDebugger($log_dir);
$configurator->setTempDirectory($temp_dir);

$configurator->createRobotLoader()
	->register();




try {
	$request_path = $argv[1];
	$list = false; // temporary disabled option to list all latte files

	if(empty($options->latte_dir) || !file_exists($options->latte_dir)) {
		error("Latte directory not found.");
	}

	$model = new stdClass();

	if(!empty($options->model_dir)  && file_exists($options->model_dir)) {
		$json = importModel('json', $options->model_dir, function($str) {
			return json_decode($str);
		});

		$neon = new Neon();
		$neon = importModel('neon', $options->model_dir, function($str) use ($neon) {
			return $neon->decode($str);
		});
	}

	// convert multidimensional array to stdClasses
	$model = json_decode(json_encode($json + $neon));

	require __DIR__ . '/app.php';
} catch(\Exception $e) {
	$file = \Nette\Diagnostics\Debugger::log($e);
	error($e->getMessage());
	if(file_exists($file)) {
		die(file_get_contents($file));
	}
	exit;
}



/*
$config = new stdClass();

$config_file = 'ristretto.json';
if(file_exists($config_file)) {
	$config = json_decode(file_get_contents($config_file));
}

$modelDir = realpath($config->model_dir);

if($config->latte_dir)
	$latteDir = realpath($config->latte_dir);
else
	$latteDir = realpath($config->www_dir);

switch($argv[1]) {
	case '--help':
	case '-h':
		die('help not available');
		break;
	case '--config':
		var_dump($config);
		exit;
		break;
	case '--model':
	case '-m':
		array_shift($argv);
		echo json_encode($json + $neon);
		break;
	case '--latte':
	case '-l':
		array_shift($argv);
		exit;
		break;
}
*/
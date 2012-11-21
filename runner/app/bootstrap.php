<?php

require __DIR__ . '/libs/autoload.php';

use Nette\Utils\Neon;
use Nette\Utils\Finder;

$configurator = new Nette\Config\Configurator;

$configurator->setDebugMode($configurator::PRODUCTION);
$configurator->enableDebugger(__DIR__ . '/../log');

$configurator->setTempDirectory(__DIR__ . '/temp');
$configurator->createRobotLoader()
	->register();


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
		try {
			require __DIR__ . '/app.php';
		} catch(\Exception $e) {
			$file = \Nette\Diagnostics\Debugger::log($e);
			echo "<html><head><title>ERROR</title></head><body>ERROR</body></html>";
			if(file_exists($file)) {
				die(file_get_contents($file));
			}
			exit;
		}
		exit;
		break;
}
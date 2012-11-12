<?php

require __DIR__ . '/libs/autoload.php';

$configurator = new Nette\Config\Configurator;

$configurator->setDebugMode($configurator::PRODUCTION);
$configurator->enableDebugger(__DIR__ . '/../log');

$configurator->setTempDirectory(__DIR__ . '/temp');
$configurator->createRobotLoader()
	->register();


$config = new stdClass();

$config_file = 'mixturette.json';
if(file_exists($config_file)) {
	$config = json_decode(file_get_contents($config_file));
}

switch($argv[1]) {
	case '--help':
	case '-h':
		die('help not available');
		break;
	case '--config':
		var_dump($config);
		exit;
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
}
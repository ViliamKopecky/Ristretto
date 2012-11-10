<?php

define('TEMPLATES_DIR', __DIR__ . '/../..');
define('MODEL_DIR', __DIR__ . '/../../model');

require __DIR__ . '/libs/autoload.php';

$configurator = new Nette\Config\Configurator;

$configurator->setDebugMode($configurator::DEVELOPMENT);
$configurator->enableDebugger(__DIR__ . '/log');

$configurator->setTempDirectory(__DIR__ . '/temp');
$configurator->createRobotLoader()
	->register();

$configurator->addConfig(__DIR__ . '/config/config.neon');

$container = $configurator->createContainer();

require __DIR__ . '/app.php';
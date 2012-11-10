<?php

require __DIR__ . '/libs/autoload.php';

$configurator = new Nette\Config\Configurator;

$configurator->setDebugMode($configurator::PRODUCTION);
$configurator->enableDebugger(__DIR__ . '/../log');

$configurator->setTempDirectory(__DIR__ . '/temp');
$configurator->createRobotLoader()
	->register();

$configurator->addConfig(__DIR__ . '/../config.neon');

$context = $configurator->createContainer();

require __DIR__ . '/app.php';
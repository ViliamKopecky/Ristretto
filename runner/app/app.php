<?php

use Nette\Utils\Finder;
use Nette\Utils\Strings;
use Nette\Templating\FileTemplate;

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
	echo '<html><head></head><body>No template</body></html>';
}

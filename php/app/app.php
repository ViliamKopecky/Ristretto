<?php

use Nette\Utils\Finder,
	Nette\Utils\Strings,
	Nette\Templating\FileTemplate;

function cropEnd($string, $endings = array()) {
	foreach($endings as $end) {
		if(Strings::endsWith($string, $end)) {
			$string = Strings::substring($string, 0, Strings::length($string) - Strings::length($end));
		}
	}
	return $string;
}
function cropStart($string, $starts = array()) {
	foreach($starts as $start) {
		if(Strings::startsWith($string, $start)) {
			$string = Strings::substring($string, Strings::length($start));
		}
	}
	return $string;
}

// convert multidimensional array to stdClasses
$model = json_decode(json_encode($json + $neon));

$options->latte_dir = cropEnd($options->latte_dir, array('/', '\\'));

if(!empty($options->model_dir)) {
	$options->model_dir = cropEnd($options->model_dir, array('/', '\\'));
}

if(Strings::endsWith($request_path, '/') || $request_path === '') {
	$request_path .= "index";
}

$request_path = cropStart($request_path, array('/'));
$name = cropEnd($request_path, array('.latte', '.html'));
$template_file = $options->latte_dir . "/$name.latte";

if(file_exists($template_file)) {
	$template = new FileTemplate($template_file);

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
		foreach (Finder::findFiles('*.latte')->from($latteDir) as $path => $template_file) {

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

			if(substr($template_file->getFilename(), 0, 1) === '@') {
				$url = false;
			}

			$name = substr($name, 1);
			$lattes[$name] = $url;
		}
		$template->lattes = $lattes;
	}

	$template->render();
} else {
	error("No teplate for /$request_path");
}

<?php

namespace Ristretto;

$options = getopt('hc:l:n:t::r:', array( 'help', 'config:', 'latte:', 'neon:', 'list-templates', 'html', 'ristretto-version' ));

require __DIR__ . '/update_composer.php';

use \Nette\Utils\Neon;
use \Nette\Utils\Finder;
use \Nette\Utils\Strings;
use \Nette\Diagnostics\Debugger;

require $autoloader_path;
require __DIR__ .'/templating.php';

if(!file_exists("$target_dir/log")) {
	mkdir("$target_dir/log", 0777, true);
}

Debugger::enable(FALSE, "$target_dir/log");
Debugger::$strictMode = TRUE;
Debugger::$onFatalError[] = function($e) {
	echo '<!--ristretto error starts-->' . file_get_contents(Debugger::log($e));
};

function err($message) {
	$options = getopt('', array( 'html' ));
	if(isset($options['html'])) {
		$t = createTemplate(__DIR__ . '/error.latte');
		$t->message = $message;
		$t->render();
	} else {
		echo "$message\n";
	}
	exit(1);
}


// help
$has_help = isset($options['h']) || isset($options['help']);
if($has_help) {
?>

-h, --help                               Shows this help.

-r, --ristretto-version <x.x.x>          Specify Ristretto version

-c, --config <path/to/ristretto.json>    States config file location.

-l, --latte  <path or url>               Renders Latte template. Config required.
-n, --neon   <path/to/file.neon>         Converts NEON to JSON.

-t, --list-templates[=<html|text|json>]  Shows list of Latte templates. Config required.

<?php exit;
}

// helpers
function detectHiddenTemplate(\SplFileInfo $file) {
	return substr($file->getFilename(), 0, 1) === '@';
}

function switchExtensions($original, $desired_extension = 'html') {
	$parts = explode('.', $original);
	if(count($parts) > 1) {
		array_pop($parts);
		$parts[] = $desired_extension;
	}
	return implode('.', $parts);
}

function modelName($filename) {
	$parts = explode('.', $filename);
	if(count($parts) > 1) {
		array_pop($parts);
	}
	$filename = implode('.', $parts);
	$parts = explode(DIRECTORY_SEPARATOR, $filename);
	return array_pop($parts);
}

function convertMultiline($str) {
	$parts = explode('"""', $str);
	$on = TRUE;
	foreach($parts as $k => $part) {
		$on = !$on;
		if($on) {
			$part = str_replace("\n", '\n', $part);
			$part = str_replace("\"", "\\\"", $part);
			$parts[$k] = $part;
		}
	}
	$str = implode('"', $parts);
	return $str;
}

function loadModel($config) {
	$model = array();
	if(isset($config['model_dir']) && file_exists($config['cwd'] . '/' . $config['model_dir']) && is_dir($config['cwd'] . '/' . $config['model_dir'])) {
		foreach(Finder::findFiles(array('*.json', '*.neon'))->in($config['cwd'] . '/' . $config['model_dir']) as $path => $file) { // no subdirs
			$model[modelName($path)] = Neon::decode(convertMultiline(file_get_contents($file->getRealPath())));
		}
		return json_decode(json_encode($model)); // easiest multidimensional array to stdClass
	}
	return new \stdClass;
}

function relativeRoot($path) {
	$prefix = './.';
	$str = '.';

	$parts = explode('/', $path);

	$result = '';
	for($i=2; $i < count($parts); $i++) {
		$result .= $prefix;
	}
	$result .= $str;

	return $result;
}

// NEON
$has_neon = isset($options['n']) || isset($options['neon']);
if($has_neon) {
	$neon_path = isset($options['n']) ? $options['n'] : null;
	$neon_path = isset($options['neon']) ? $options['neon'] : $neon_path;
	if(!file_exists($neon_path)) {
		err("NEON file `$neon_path` cannot be found.");
	}
	echo json_encode(Neon::decode(convertMultiline(file_get_contents($neon_path))));
	exit;
}

// Latte things
$has_config = isset($options['c']) || isset($options['config']);
$has_latte = isset($options['l']) || isset($options['latte']);
$has_list_templates = isset($options['t']) || isset($options['list-templates']);
if($has_config || $has_latte || $has_list_templates) {
	$config_path = isset($options['c']) ? $options['c'] : null;
	$config_path = isset($options['config']) ? $options['config'] : $config_path;
	$cwd = realpath(dirname($config_path));

	if(!file_exists($config_path)) {
		err("Config file `$config_path` cannot be found.");
	}

	$config = Neon::decode(convertMultiline(file_get_contents($config_path)));
	$config['cwd'] = $cwd;

	if(empty($config['www_dir'])) {
		$config['www_dir'] = $cwd;
	}

	if(empty($config['latte_dir'])) {
		$config['latte_dir'] = $config['www_dir'];
	}

	if(empty($config['model_dir'])) {
		$config['model_dir'] = $config['www_dir'] . '/model';
	}

	if($has_latte) {
		$latte = isset($options['l']) ? $options['l'] : null;
		$latte = isset($options['latte']) ? $options['latte'] : $latte;
		$path_exists = file_exists($latte) && is_file($latte);
		$latte = Strings::trim($latte, ':');
		$latte = switchExtensions($latte, 'latte');
		$url = Strings::trim($latte, '/');
		$url_path = realpath($cwd . '/' . $config['latte_dir']).'/'.$url;
		$url_exists = file_exists($url_path);
		if($path_exists) {
			$template = createTemplate($url_path);
			$template->baseUrl = $template->basePath = relativeRoot($url_path);
			$template->render(); exit;
		} else if($url_exists) {
			if(is_dir($url_path)) {
				$url_path = rtrim($url_path, '/');
				$url_path .= '/index.latte';
			}
			if(file_exists($url_path)) {
				$template = createTemplate($url_path);
				$template->model = loadModel($config);
				$template->baseUrl = $template->basePath = relativeRoot($url_path);
				$template->render(); exit;
			} else {
				err("Latte file `{$url_path}` cannot be found.");
			}
		} else {
			err("Latte file `{$latte}` cannot be found.");
		}
		err("Converting Latte currently not available.");
	}

	if($has_list_templates) {
		if(!file_exists($cwd . '/' . $config['latte_dir'])) {
			err("Latte directory `{$config['latte_dir']}` cannot be found.");
		}
		$files = Finder::findFiles('*.latte')->exclude('@*.latte')->from($cwd . '/' . $config['latte_dir']);
		$links = array();
		foreach($files as $k => $v) {
			$links[] = $path = switchExtensions($k);
			echo "$path\n";
		}
		exit;
	}
} else {
	err("Config file not specified. Use `--config path/to/ristretto.json`.");
}

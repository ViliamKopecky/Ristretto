<?php

namespace Ristretto;

use \Nette\Templating\FileTemplate;
use \Nette\Latte\Engine;

function createTemplate($filename) {
	$template = new FileTemplate($filename);

	$template->registerHelperLoader('Nette\Templating\Helpers::loader');
	$template->registerFilter(new Engine);

	$texy = new \Texy();

	$template->registerHelper('texy', function ($s, $headingTop = 2) use ($texy) {
		$temp = $texy->headingModule->top;
		$texy->headingModule->top = $headingTop;
		$str = $texy->process($s);
		$texy->headingModule->top = $temp;
		return $str;
	});

	$template->registerHelper('texyline', function ($s) use ($texy) {
		return $texy->processLine($s);
	});

	$template->baseUrl = $template->basePath = '/';

	return $template;
}
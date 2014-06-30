<?php

namespace Ristretto;

use \Nette\Templating\FileTemplate;
use \Nette\Latte\Engine;
use \Nette\Latte\Macros\MacroSet;

function createTemplate($filename) {
	$template = new FileTemplate($filename);

	$template->registerHelperLoader('Nette\Templating\Helpers::loader');

	$latte = new Engine;

	$set = new MacroSet($latte->getCompiler());
	$set->addMacro('paste', 'include dirname($template->getFile()) . DIRECTORY_SEPARATOR . %node.word');

	$template->registerFilter($latte);

	$texy = new \Texy();
	$texy->imageModule->root = '';
	$texy->imageModule->linkedRoot = '';

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

<?php

$should_update_composer = 
	   !file_exists($options->temp_dir . '/libs/autoload.php')
	|| !file_exists($options->temp_dir . '/last-updated.txt')
	|| 10 < $now->diff(new DateTime(file_get_contents($options->temp_dir . '/last-updated.txt')))->days;

if($should_update_composer) {
	header('Content-Type: text/html;charset=utf-8');
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Updating PHP dependencies, please wait</title>
<style>body { font-family: sans-serif; }</style>
</head>
<body>
<h1>Ristretto is updating PHP dependencies.</h1>
<?php
	copy(__DIR__ . '/../composer.json', $options->temp_dir .'/composer.json');
	copy(__DIR__ . '/../composer.phar', $options->temp_dir .'/composer.phar');

	$cwd = getcwd();
	chdir($options->temp_dir);
	fwrite(STDERR, "\n[working] Please wait while PHP dependencies are being updated.\n");
	exec('php composer.phar self-update', $result);
	exec('php composer.phar update', $result);
	$result = implode("\n", $result);
	fwrite(STDERR, "\n$result\n");
	fwrite(STDERR, "\n[updated]\n");
	file_put_contents($options->temp_dir . '/last-updated.txt', $now->format('r'));
	chdir($cwd);
?>
<script>window.location.reload();</script>
</body>
</html>
<?php
	exit;
}
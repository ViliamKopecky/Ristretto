<?php

$now = new \DateTime;

$temp_dir = sys_get_temp_dir();

$target_dir = "$temp_dir/ristretto";;

$ristretto_version = isset($options['r']) ? $options['r'] : (isset($options['ristretto-version']) ? $options['ristretto-version'] : null);

if(!empty($ristretto_version)) {
	$target_dir .= "-$ristretto_version";
}

$autoloader_path = "$target_dir/vendor/autoload.php";
$meta_path = "$target_dir/last-updated.txt";

$composer_dir = __DIR__ . '/composer';

$package_filename = 'composer.json';
$copy_files = array( 'composer.phar', $package_filename );

if(!file_exists($target_dir)) {
	mkdir($target_dir, 0777, true);
}
foreach($copy_files as $f) {
	if(!file_exists("$target_dir/$f")) {
		if(!copy("$composer_dir/$f", "$target_dir/$f")) {
			fwrite(STDERR, "\n[error] Could not move `$composer_dir/$f` => `$target_dir/$f`.\n");
		}
	} else {

	}
}

$should_update_composer = 
	   !file_exists($autoloader_path)
	|| !file_exists($meta_path)
	|| 10 < $now->diff(new DateTime(file_get_contents($meta_path)))->days;

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
	copy("$composer_dir/$package_filename", "$target_dir/$package_filename");

	$cwd = getcwd();
	chdir($target_dir);

	fwrite(STDERR, "\n[working] Please wait while PHP dependencies are being updated.\n");
	exec('php -d detect_unicode=Off composer.phar self-update', $result);
	exec('php -d detect_unicode=Off composer.phar update --prefer-dist', $result);
	$result = implode("\n", $result);
	fwrite(STDERR, "\n$result\n");
	fwrite(STDERR, "\n[updated]\n");
	file_put_contents($meta_path, $now->format('r'));
	chdir($cwd);
?>
<script>window.location.reload();</script>
</body>
</html>
<?php
	exit;
}
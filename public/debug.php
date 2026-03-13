<?php
header('Content-Type: text/plain');
echo "Current Directory: " . __DIR__ . "\n";
echo "Listing for /var/www/html/:\n";
print_r(scandir('/var/www/html/'));

if (is_dir('/var/www/html/App')) {
    echo "\nListing for /var/www/html/App/:\n";
    print_r(scandir('/var/www/html/App/'));
} else if (is_dir('/var/www/html/app')) {
    echo "\nFound lowercase 'app' folder instead of 'App'\n";
    print_r(scandir('/var/www/html/app/'));
} else {
    echo "\nNeither 'App' nor 'app' folder found at /var/www/html/\n";
}

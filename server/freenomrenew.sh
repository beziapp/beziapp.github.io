#!/bin/bash

# chrome generated this curly script when I was renewing zavij.ga.

curl 'https://my.freenom.com/domains.php?submitrenewals=true' \
  -H 'Connection: keep-alive' \
  -H 'Cache-Control: max-age=0' \
  -H 'Upgrade-Insecure-Requests: 1' \
  -H 'Origin: https://my.freenom.com' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) snap Chromium/83.0.4103.61 Chrome/83.0.4103.61 Safari/537.36' \
  -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9' \
  -H 'Sec-Fetch-Site: same-origin' \
  -H 'Sec-Fetch-Mode: navigate' \
  -H 'Sec-Fetch-User: ?1' \
  -H 'Sec-Fetch-Dest: document' \
  -H 'Referer: https://my.freenom.com/domains.php?a=renewdomain&domain=1064714470' \
  -H 'Accept-Language: en-US,en;q=0.9' \
  -H 'Cookie: G_ENABLED_IDPS=google; __zlcmid=yWjBN83fd0bq6c; mydottk_languagenr=0; dottyLn=en; wwwLn=en; WHMCSZH5eHTGhfvzP=54n5ikbop5na02s7qbf3ld1n64; WHMCSUser=1006649624%3Ae3c7c7706689fce5e12a4faa0644c87dabbae7a0' \
  --data-raw 'token=d1d5c56d9dbedaa1e32d8fb66310591a2d1f1da8&renewalid=1064714470&renewalperiod%5B1064714470%5D=12M&paymentmethod=credit' \
  --compressed

# don't worry, I've invalidated cookies. At least I hope that's what logout does.

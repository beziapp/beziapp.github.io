#!/bin/bash
# this is a script to test if we can get files from sharepoint in an easy way. #fuckrosoft

curl 'https://gimnazijabezigrad.sharepoint.com/Gim/DatSpl/Gimb%20%C5%A0olska%20pravila%20ocenjevanja%202019_20.pdf' \
  -H 'authority: gimnazijabezigrad.sharepoint.com' \
  -H 'cache-control: max-age=0' \
  -H 'upgrade-insecure-requests: 1' \
  -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) snap Chromium/83.0.4103.61 Chrome/83.0.4103.61 Safari/537.36' \
  -H 'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9' \
  -H 'sec-fetch-site: none' \
  -H 'sec-fetch-mode: navigate' \
  -H 'sec-fetch-user: ?1' \
  -H 'sec-fetch-dest: document' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'cookie: nSGt-0F5C552C67D73B521FBC79E429B19BDACAD60901BA94F0F7=gYEwMThFQjM0NTU1MjE0RkQyOTMyRUY3MEFBM0EyNTc1RTMwMjk4QTlEQjk0RjJBRDY5MDBGNUM1NTJDNjdENzNCNTIxRkJDNzlFNDI5QjE5QkRBQ0FENjA5MDFCQTk0RjBGNxIxMzIzNTc1NzEwNDE4MDQ3NTIgZ2ltbmF6aWphYmV6aWdyYWQuc2hhcmVwb2ludC5jb20l6emYjLtdSZH+qYiO8V6/lU1eeE4X4HEulbeqPNPqfZ84humJDzVIOi5BgnAVXq2FhXmQUJFVpRO83UVCPWy8jR3s5QweUhfiB6SJP6vVltUwKzbjyPGQf7h1ykLNXvOBJL+icoKtulLKHZ1nwZuYcByYHHoJFLHERm/PKVhaN4ixIepiui3mEZrv8yzxZdX7Brzz2lAHF/DvqnK10U2p6FzcvmkBHTBpyFL86QYnuEwEXVmHsWq+uFBMYwQemY3S1goKVZONN8oUDKbr3woIOf2/YK5TfEPdaWOWkGROmFeDMxx/eAEoFHKd2HOM1PJM+H9MX1qP/BNo3G3+6cIFmAAAAA==; rtFa=ZRFHgKH1ffwmMES9Vjd7ein7sIVcTByBP6hlk6Fb8DgmRTcwQUE5M0QtRTQ1NS00MUU4LTg5MzEtRkFCOTYwQTlCNkJBptaV0VQGYEWk2f0ThJtHccyMco6F7IoScwB1jD7W8zpkcGPhrpbcCxy2lrfJyd4nS/B311WEl2k+c6VUZqkcDJQ6On5wZ486tQi5J+H27wfAd+/Z7VO9CqtiOL9jiWWub+qiCE1EpPlsCwrbDmV4TCToUY9lnZVG8Zw9B7iam73f82I5YSZ9P/rCcHqfd27YjL/EIuMTy8F/ned9AT7hnWvKpr0l2moEjoKInIaTPrEda50jv7hvQlKb6RYuSbV4YrC8Bcmn2JqDb7X7WXPXXYLBfzUcbqFaxkqoOUlXwkWvKNS3gSXSTeSEVAOjTJZ0OME5MrcYLKIN70G2BoX0eEUAAAA=; FedAuth=77u/PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48U1A+VjgsMGguZnxtZW1iZXJzaGlwfDEwMDMzZmZmODZhNWM0NmZAbGl2ZS5jb20sMCMuZnxtZW1iZXJzaGlwfHdlYnVzZXJAZ2ltYi5vcmcsMTMyMzU3NTY1MjYwMDAwMDAwLDEyODcyMTgzNzMzMDAwMDAwMCwxMzIzNjE4ODUzMDEwMjIyMDYsMTg4LjIzMC4xMjkuNjYsMyxlNzBhYTkzZC1lNDU1LTQxZTgtODkzMS1mYWI5NjBhOWI2YmEsLDM0ZmNmNWEyLWZjNGMtNGFhOC1iZDRmLTEyZWJjZmFmOTFiYSw3NjIwNTk5Zi04MDk2LWEwMDAtNjExYy1jN2ZjODBmMGI2NDIsNzYyMDU5OWYtODA5Ni1hMDAwLTYxMWMtYzdmYzgwZjBiNjQyLCwwLDEzMjM1ODQyOTMwMDU1MzU1NywxMzIzNjAxNTczMDA1NTM1NTcsLCwsMjY1MDQ2Nzc0Mzk5OTk5OTk5OSwxMzIzNTc1NjUyOTAwMDAwMDAsZTE5NTRlMDMtNDZlMS00OTY5LTg4NWUtODMzZGY5NjE5YTU3LElySW16VXRjaWpwSjlGNlluMEpZMERicldsblE1anBYRkxSaGJYSGt6eGtvNXcwcGJyOVZwZVJGNXJlOWdLa1ZFVEtLRFFBcWxTWnN6YnJFQ3lCT1FQbEgrdFVkeTZUcStydk0zOEVqMVlQMFh5SE1JWmRHWjFrYTVGcWY3MzVCOE03VGhkSGVKcnpqNzlPR01kR1pzVE9JOUo4WDlkRkcrMGJkRnVsY1JBanh5ckd3U2szWlpwY0NiNTFLN3NpQTJHOEE5ODZTa2VqSkJBaVpCWk5HRElNSG5JSTAyRXVZaVN1OCtqbWxFUHU4OVhxTlpXRmZYNHpxdEM1TnNKRURwZ0RsKzFnMUFDOFBsaXBMMjh5YTcyRWY5N1RqTWdOQlIxcCtEeVlLUUdNWVdRUFp6NG5DUU9HRGU2REhpMnRDYWZWU2c5TUM0TGlrcEZTNVl4YWdVUT09PC9TUD4=; CCSInfo=Ny4gMDYuIDIwMjAgMTc6MDc6MDg0fL7YWM9M1GwNXmIVSDq7jc1NY/Qod+/ZRKTvTkTqlaRXX01bAepfiS+zo61xxrv7g20l+dy8VjQVb9Jby19pTGWx+PwCrrCdGVLf8uW+AbVkS8mD8mZPWu8XrP5qHxcs2I5JoTJkUGkO/HNO1DDrXFAYmONZ1PEKbRJE5XijlaaGEM6I+lv1EvNXQxAau/H3BnbqXqHi3sK/PBDS6JGPw/qQVxuE9kr4IdA6XcCbok64aU4sjtKbo0J0csclZIqZkRwO0dCh16oSS4mnsATVqlPtLggROb30dognrv16+XaxSUY6dUAEoL/NpaYdgMmo9pyLsItuu41XKRO0bAklFAAAAA==' \
  -H 'if-none-match: "{B7F3D3FC-A5A1-4919-9076-2C7804E4A31F},2"' \
  -H 'if-modified-since: Wed, 11 Dec 2019 10:12:19 GMT' \
	-o output.pdf \
  --compressed

# they're fixking with me, right? why would anyone need 1 kilobyte of data in a cookie,,, A SESSION COOKIE!=?!=?

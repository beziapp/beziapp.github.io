# BežiApp

BežiApp je bolj tako uporabnikom kot strojem prijazen sistem za povezavo in pridobivanje informacij Gimnazije Bežigrad, ki ga
razvija ekipa gimb-dev (@rstular in @asijanec).

## zakaj?

brez BežiApp orodij je uporaba eRedovalnice za dijake in starše grozna uporabniška izkušnja. Uradna aplikacija je bila narejena
leta 2009, in teče na Microsoft ASPX .NET C# okolju. Verjamemo, da uporaba takih orodij nikakor ni dobra izbira, saj na dolgi rok
prinaša vedno več težav. BežiApp lepo izgleda, je izdelan v minimalističnem, a kompaktnem slogu, ki deluje na dlančnikih in
računalniških zaslonih in ima lepo dokumentirane APIje. Poleg tega je 100% odprtokoden.

brez BežiApp orodij je strojno upravljanje s podatki oteženo. GimB za podatke nima APIja, vse gre prek izdelanih HTML strani.

za bežigrajske programe je znanih veliko programskih lukenj, ki ogrožajo uporabniško varnost. Najditelji napak zgimsisa in ostalih
storitev njihove razvijalce o svojih varnostnih pomislekih opozorili, vendar programerji napak nikoli niso odpravili. Ker večina
ljudi, s tem tudi jaz, nočemo uporabljati programov, ki naša računalniška orodja vzpostavljajo napadalcem, smo razvili 100%
preverljivo programje, ki med drugim te napake tudi večinoma odpravi.

## APIji

BežiApp programerji izdelujemo knjižnice za integracijo avtomatskih zahtev v bežigrajske storitve, kot so lopolis in
zgimsisext. Te knjižnice so javno dostopne.

* https://github.com/rstular/lopolis-api se uporablja za avtomatizirano naročanje hrane
* `gsec.js` se uporablja za avtomatizirano obdelavo podatkov GimSISExt platforme v Javascript jeziku
* https://github.com/sijanec/gimsisextclient se uporablja za avtomatizirano obdelavo podatkov GimSISExt platforme v PHP jeziku

## uporaba BežiAppa

za uporabnike bo verjetno najlažje BežiApp uporabljati iz strežnikov, ki jih vzpostavlja ekipa gimb-dev (gimb.tk). Aplikacija je
dostopna iz trgovine Android Market (Google Play Store).

za uporabnike iPhone telefov je proces nastavitve malce drugačen, vendar sila preprost. Navodila so na naši instagram strani,
https://www.instagram.com/p/B8bZGkugjKp/.

### namestitev na lasten strežnik.

pogruntaj sam!

## gimb.tk strežniki

dijaki GimB, ki so člani gimb-dev skupine postavljajo strežnike v dobro Gimnazije. Te strežniki so javno dostopni na domeni
gimb.tk in kdorkoli se lahko poslužuje njihovih storitev, povsem brezplačno.

med drugim te strežniki gostujejo:

* GimB Meet aplikacijo za videokonference (video.gimb.tk),
* spletne učilnice s šifrirano povezavo in lajševalniki za izdelavo kvizov (ucilnice.gimb.tk),
* zgimsisext s šifrirano povezavo (zgimsis.gimb.tk),
* avtentikacijski strežnik GimB osebja, dijakov in staršev (auth.gimb.tk),
* portal za prijavo napak razvijalcem BežiAppa (beziapp-report.gimb.tk),
* BežiApp (app.gimb.tk, dev.gimb.tk)
* gimsisextclient inštalacijo (gimb.tk/test.php)
* reddit bota za preverjanje pristnosti dijakov podbralnika r/bezigrad (reddit.gimb.tk)

in še veliko več.

strežniki delujejo povsem v skladu z zakoni in so povezani v akademsko in raziskovalno internacionalno omrežje GÉANT. Vanj jih
povezuje operater akademskega in izobraževalnega omrežja Grčije, grNET.

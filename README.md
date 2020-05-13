# for developers (rstular)

from sijanec

I was frustrated by the fact that I needed to change side navigation on 10+ individual html files if I added a page or wanted 
to change a single icon. So I wrote this small script that includes html files from other html files. Syntax `<@?i 
navigation@>` in a .bvr file in [pages-src](pages-src) will include [`navigation.bvr` from 
`pages-src/misc/`](pages-src/misc/navigation.bvr). PATH (where to search for files to include) can be set in 
[`global.bvr`](global.bvr) (separated with a space). Variables can also be set without touching the disk (faster, idrk) with 
`<@?s variable_name variable value@>` and read with `<@?s variable_name@>`. To execute a command and surpress output, use 
`<@#?x arg@>` where `x` is the command.

So now pages are now in pages-src and before deployment, `./compose_html pages-src/ pages/` has to be run to update the pages 
dir.


idkr, it seemed like a good idea, but feel free not to use it (write about it here so I won't override your commits).

the compiled binary works on "`Linux kondenzator 5.3.0-46-generic #38~18.04.1-Ubuntu SMP Tue Mar 31 04:17:56 UTC 2020 x86_64
x86_64 x86_64 GNU/Linux`".

this is close to how I compiled it:
```
idrk=`pwd`
cd /tmp
git clone https://github.com/sijanec/bverbose
cd bverbose
gcc test/compose-all-in-dir.c -I lib -I src
mv a.out $idrk/compose_html
cd $idrk
```

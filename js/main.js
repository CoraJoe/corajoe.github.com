require([],function(){function i(){$(".article").each(function(){$(this).offset().top<=$(window).scrollTop()+$(window).height()&&!$(this).hasClass("show")?($(this).removeClass("hidden").addClass("show"),$(this).addClass("is-hiddened")):$(this).hasClass("is-hiddened")||$(this).addClass("hidden")})}var n=!1,e=function(){require(["/js/mobile.js"],function(i){i.init(),n=!0})},a=!1,t=function(){require(["/js/pc.js"],function(i){i.init(),a=!0})},r={versions:function(){var i=window.navigator.userAgent;return{trident:i.indexOf("Trident")>-1,presto:i.indexOf("Presto")>-1,webKit:i.indexOf("AppleWebKit")>-1,gecko:i.indexOf("Gecko")>-1&&-1==i.indexOf("KHTML"),mobile:!!i.match(/AppleWebKit.*Mobile.*/),ios:!!i.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/),android:i.indexOf("Android")>-1||i.indexOf("Linux")>-1,iPhone:i.indexOf("iPhone")>-1||i.indexOf("Mac")>-1,iPad:i.indexOf("iPad")>-1,webApp:-1==i.indexOf("Safari"),weixin:-1==i.indexOf("MicroMessenger")}}()};$(window).bind("resize",function(){if(n&&a)return void $(window).unbind("resize");var i=$(window).width();i>=700?t():e()}),r.versions.mobile===!0||$(window).width()<700?e():t(),yiliaConfig.fancybox===!0&&require(["/fancybox/jquery.fancybox.js"],function(){var i=$(".isFancy");if(0!=i.length){for(var n=$(".article-inner img"),e=0,a=n.length;a>e;e++){var t=n.eq(e).attr("src"),r=n.eq(e).attr("alt");n.eq(e).replaceWith("<a href='"+t+"' title='"+r+"' rel='fancy-group' class='fancy-ctn fancybox'><img src='"+t+"' title='"+r+"'></a>")}$(".article-inner .fancy-ctn").fancybox()}}),yiliaConfig.animate===!0&&(require(["/js/jquery.lazyload.js"],function(){$(".js-avatar").attr("src",$(".js-avatar").attr("lazy-src")),$(".js-avatar")[0].onload=function(){$(".js-avatar").addClass("show")}}),yiliaConfig.isHome===!0&&($(window).on("scroll",function(){i()}),i())),1==yiliaConfig.open_in_new&&$(".article a[href]").attr("target","_blank")});
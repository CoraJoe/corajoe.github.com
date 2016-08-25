/* _______________________________________
 * | @author  >|   Joe                    |
 * | @email   >|   icareu.joe@gmail.com   |
 * | @date    >|   2014-04-16 13:51:13    |
 * | @content >|   为容器内多目录文章添加 |  
 * | @content >|   自动导航 依据h1--h6识别|
 * | @content >|   定位点与层级           |
 * |___________|__________________________|
 */
/*
 * 兼容性测试兼容到 ie7, ie6暂未测试
 */

 (function($){
  $.fn.guide = function(options){
    //混合参数
    options = options || {};
    //console.log($.fn.guide.defaults);
    opts = $.extend({},$.fn.guide.defaults,options);
    var $cont = $(this);

    //一个页面仅支持一个容器导航
    if($cont.length > 1){
      return;
    }

    var init = function(){
      //给目录增加样式
      styleGuide(opts.guideClass);

      hxArrSet = _getHxLen();
      if(!hxArrSet) return;
      // 如果存在任意h1-h6
      if(parseInt(hxArrSet.join(""),10) > 0){

        //添加目录框架
        _showFrame();

        //按目录排序 
        addAnchor("linked");

        //排序，替换
        hxSort();
         
        //为正文hx编号
        setNo();
               
        if(opts.isScorllShow){
          scrollShow();
        }
      }else{
        return;
      }
    },
    
    //获取h1-h6各长度值
    _getHxLen = function(){
      var num, total = 0,
          hxObj    = [],        //存放多级目录对象
          hxArr    = [];          //存放多级目录的数组
      for(var i=1; i<=6; i++){
        //hxObj.push($cont.find("h"+i));
        num = $cont.find("h"+i).length;
        total += num;
        hxArr.push(num);
      }
      //如果hx数不足 hxnum 个不显示导航
      if(total < opts.hxnum){
        return;
      }

      //返回包含hx的数据与hx长度的数据
      return hxArr;
    },  
  
    //创建容器
    _showFrame = function(){
      var $placeDom = $(opts.placeDom);
      $placeDom.prepend('<div class='+opts.guideClass.slice(1)+'></div>');
      var $guideDom = $placeDom.find(opts.guideClass);

      if(opts.placeDom === 'body'){
        $guideDom.addClass('fixed').removeClass('relate');
      }else{
        $guideDom.addClass('relate').removeClass('fixed').prepend('<span class="switch-pos">切换显示</span>');
        $placeDom.find('.switch-pos').click(function(){
          !$guideDom.hasClass('fixed') ?
          $guideDom.addClass('fixed').removeClass('relate') :
          $guideDom.addClass('relate').removeClass('fixed');
        });
      }
    },    

    //创建锚点 是link Or Linked
    addAnchor = function(linkOrLinked){
        //遍历h1-h6
        var thishx;
        //hno h的级别  h1, h2
        //hnum h级的序号
        for(var hno=1; hno<=6; hno++){
          //存在hx的情况
          if(hxArrSet[hno-1] > 0){
            var hsumno = 1; //同级下hx编号
            //对每一个hx遍历
            for(var hnum=1; hnum <= hxArrSet[hno-1]; hnum++){
              if(linkOrLinked === "linked"){
                //创建锚点对象并添加class hx以便hx替换后a后按序查找
                thishx = $cont.find("h"+hno).eq(hnum-1).addClass("h"+hno);
                thishx.attr({"name":"to"+hno+hnum, "id":"to"+hno+hnum});

              }else if(linkOrLinked === "link"){

                //创建锚点链接    hx被替换成a，导致无法查找，因此以class查找 
                //去掉里层链接
                thishx = $(opts.guideClass).find(".h"+hno).eq(hnum-1).attr({"href":'#to'+hno+hnum}).attr({"code-num": '#to'+hno+hnum});

                //只支持三级目录
                //从h2起开始编号
                if(hno === 2){          
                    thishx.prepend('<span>'+ hnum +' </span>');
                }else if(hno === 3){
                    var hsub = hnum+1;
                    //如果前面有同类则序号+1，否则；
                    thishx.prev().hasClass('h'+hno) ? hsumno++ : (hsumno=1);
                    //查找最近的上级hx
                    var subIndex = parseInt(getClosestElemByClass(thishx, 'a.h2').find('span').text(),10);
                    thishx.prepend('<span>'+ subIndex + '.' + hsumno + ' </span>');
                }else if(hno > 3){
                    thishx.prepend('<span>• </span>');
                }

                //替换标签后添加class以便不影响查找
                thishx.replaceWith('<a code-num="#to'+hno+hnum+'" href="#to'+hno+hnum+'" class="h'+ hno +'">' + thishx.html()+ '</a>');
          
              }
  
            }
          }
        }         
    },
    //获取同级最近的className元素，上级用closest();
    getClosestElemByClass = function($elem, className){
      return !$elem.prev().hasClass(className) ? $elem.prev() : getClosestElemByClass($elem.prev(), className);
    },

    //排序sort
    hxSort = function(){
      var newHxDom =$cont.find("h1,h2,h3,h4,h5,h6").clone();
      $(opts.guideClass).append(newHxDom);
      //添加锚点链接
      addAnchor("link");
    },
    //为正文添加编号
    setNo = function(){
      $(opts.guideClass).find('a').each(function(i,item){
        var $i = $(item);
        var findIndex = $i.attr('href').substring(1);
        var findNo = $i.find('span').text();
        $cont.find('[name="' + findIndex + '"]').prepend('<span>'+findNo+'</span>');
      })
    },
    //给导航添加样式 
    styleGuide = function(mainClass){
        var $styleDom = $('<style type="text/css"></style');    
        var guideFrame = 
         mainClass + '{max-width:280px; background-color : #fff; padding : 10px; z-index: 10000}' +
         mainClass + '.fixed{top:50%; right:10px;  margin-top : -150px; overflow : auto; z-index : 10000; position: fixed; box-shadow: 0 1px 10px #999; max-height : 300px;}' +
         mainClass + '.relate{border : 2px solid #ddd; position: relative; margin:0 0 0  50px; float: right;}' +
         mainClass + ' a { display: block; font-size: 12px; color: #333; text-decoration: none; line-height : 24px; padding-left : 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-algin: left }' +
         mainClass + ' a.active { color:green }'+
         mainClass + ' .h1{ font-size: 15px; font-weight: bold; border-bottom : 1px solid #ddd; margin-bottom: 8px; max-width: 200px; padding-right:80px; }' +
         mainClass + ' .h2{ color: #555; font-size: 13px; font-weight:bold; margin-bottom:1px;}' +
         mainClass + ' .h3{ margin-left: 15px; color: #666; font-size: 13px;  margin-bottom:2px; }' +
         mainClass + ' .h4{ margin-left: 30px; color: #777;  margin-bottom:4px;  }' +
         mainClass + ' .h5{ margin-left: 45px; color: #999;  margin-bottom:6px;  }' +
         mainClass + ' .h6{ margin-left: 60px; color: #aaa;   }' + 
         mainClass + ' .switch-pos{ position:absolute; right:10px; top: 5px; color: #fff; background-color:rgba(0,0,0,.5); cursor: pointer; padding: 0 5px; font-size:13px; line-height:25px; border-radius:2px;}';
        //ie
        if( $styleDom[0].styleSheet ){
          $styleDom[0].styleSheet.cssText = guideFrame;
        }else{
          $styleDom.text(guideFrame);
        }

        $("head").append($styleDom);
    },

    scrollShow = function(){
      var $keyElem;
      //滚动时相应显示所在条目
      $(window).scroll(function(){
        $cont.find("h1,h2,h3,h4,h5,h6").each(function(i){
          //只要滚动范围没超出最近某一个hx元素, 此hx的上一个即为正在浏览的
          if( Math.ceil( $(this).offset().top ) - $(window).scrollTop() >= 5 ){
           //找出最小的大于0的hx元素,用href查找的话在ie7以前href会自动加上域名
           $keyElem = $('a[code-num="#'+$(this).attr("name")+'"]');
           $keyElem.prev().addClass("active").siblings().removeClass("active");
           return false;
          }else{
            if($keyElem)
              $keyElem.addClass("active").siblings().removeClass("active");
          }
         })
      });     
    };
    //启动
    init(); 
  }

  //默认参数
  $.fn.guide.defaults = {
    guideClass   : ".guide-frame", //
    placeDom: "body",   //导航默认在body级，悬浮;
    hxnum: 5,            //如果hx数不足 hxnum 个不显示导航
    isScorllShow : true,
  }
 })(jQuery)
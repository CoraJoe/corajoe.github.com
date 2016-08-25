/*
 * @auth icareu.joe@gmail.com
 * @https://github.com/ccjoe/viewbind.js
 * 基本实现基于jQuery的双向绑定和基于绑定的渲染
 */

if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }
    var aArgs = Array.prototype.slice.call(arguments, 1), 
        fToBind = this, 
        fNOP = function () {},
        fBound = function () {
          return fToBind.apply(this instanceof fNOP ? this : oThis || this, aArgs.concat(Array.prototype.slice.call(arguments)));
        };
    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();
    return fBound;
  };
}

var utils = {
  //val则set, 否则get
  descendantVal: function (obj, path, value) {
     if(!obj) return null;
      var i = 0, path = path.split('.');
      for (; i < path.length; i++) {
          if (value != null && i + 1 === path.length)  obj[path[i]] = value;
          obj = obj[path[i]]
          if(!obj) return
      }
      return obj;
  },
  hasAttr: function($ele, prop){
    var attr = $ele.attr(prop)
    return (attr !== void 0 && attr !== false) ? attr : false;
  },
  eachAttr: function(ele, callback){
    $.each(ele.attributes, function(index, attr){
        callback(index, attr.nodeName);
    })
  }
}
/*
 * @param {opts} object 参列
 * @param {opts.data} object|function 数据
 *
 */
var ViewBind = function(opts){
    $.extend(this, opts);
    this.modelId = opts.modelId;
    this.$el = typeof opts.$el === 'string' ? $(opts.$el) : opts.$el,
    this.data = typeof opts.data === 'function' ? opts.data() : (opts.data || {});
    this.$view = this.$el ? $(this.$el.html()) : $(opts.view);   //模板内容
    this.events = opts.events;
    this.init();
}

ViewBind.prototype = {
    init: function(){
        this.created ? this.created() : null;
        this.render();
        this.vb = this.bind();
        this._parseEvent();
    },
  /*
   * @param {key} string 数据的key
   * @param {val}  数据的值
   * @example vb.set('name', 'joe')   //触发局部更新
   *          vb.set({name: 'joe', pwd: '123456'}) //触发全局更新
   */
    set: function(key, val){
        var oldval;
        if(arguments.length > 1){
          oldval = this.data[key];
          this.data[key] = val;
        }else{
          oldval = this.data; val = key; key=void 0;
          this.data = $.extend(this.data, val);  //保留实例中新定义的数据
        }
        this.vb.trigger(this.modelId + ':change', [key, val, oldval]);
    },

    get: function(key){
        return this.data[key];
    },
    //sub为true则获取key及key子属性相关的绑定
    attr: function(directive, key, sub){
      return '[vb-' + directive + (key ? ((sub ? '^' : '') + '="' + key + (sub ? '."' : '"')) : '') + ']'
    },
    //获取model下所有绑定的元素的选择器, 传key则获取相应的元素的选择器 绑定元素可以由vb-[modelId] 或 vb-model, 值可能为a或a.b.c
    selector: function(key, sub){
        return this.attr(this.modelId, key, sub)+',' + this.attr('model', key, sub)
    },

    //获取modelname与model绑定下值为datekey的元素 sub包含datekey子级属性, $views 无则默认组件下所有, isitem|true'vb-item'
    elem: function(key, opts){
        var sub = opts && opts.sub, $views = opts && opts.$views, isitem = opts && opts.isitem;
        var selector = !isitem ? this.selector(key, sub) : this.attr('item', key, sub);
            $views = $views || this.$view;
        return $views.filter(selector).add($views.find(selector))
    },

    bind: function(){
        var that  = this;
        var pubSub = jQuery({});  // 使用jQuery空对象作为监听对象 // 监听dom中所有元素的 data-binding 属性变化。并由pubSub来处理。
        var message = this.modelId + ':change';
        this.$el.on('input change', that.selector(), function (event) {
            var $ele = $(this), newval = $ele.val(), oldval = $ele.data('vb-val'),
                bindmodelId = utils.hasAttr($ele, 'vb-' + that.modelId), 
                bindmodel = utils.hasAttr($ele, 'vb-model');
            var bind =  bindmodelId || bindmodel;
            if(bind) pubSub.trigger(message, [bind, newval, oldval]);
            if(bindmodel) pubSub.trigger(message, [bindmodel, newval, oldval]);

            $ele.data('vb-val', newval);  //before val
            if(bind) that.watchKey(bind, newval, oldval) //为model设置值
        });

        // pubSub把数据变化推送给所有与之绑定的页面元素
        pubSub.on(message, function (event, key, value) {
            if(key === void 0){   //全局更新视图
              that.render();
              that.attached ? that.attached() : null;
              return;
            } 
            that.data[key] = value;
            that.setElemValue(key, void 0, {value: value})
            that.renderSubKey(key, void 0, {value: value});
        });
        return pubSub;
    },
        //模板的全局更新
    render: function(){
        var $views = this.$view,  data = this.data;
        this.renderObject(data, {$views: $views});
        this.$el.html($views);
    },

    renderObject: function(obj, opts){
      var that = this;
        $.each(obj, function(vkey, val){
            opts.sub = false;
            that.setElemValue(vkey, obj, opts)
            that.renderSubKey(vkey, obj, opts)
        })
    },
    renderSubKey: function(key, values, opts){
      var that = this; if(opts) opts.sub = true;
      var $subKeyElem = this.elem(key, opts)
      if($subKeyElem.length){
        $subKeyElem.each(function(){
          var attrval, elem = this;
          utils.eachAttr(elem, function(index, str){
            attrval = $(elem).attr(str);
            if(attrval.indexOf(key) === 0){
              if(opts) opts.sub = false;
              that.setElemValue(attrval, values,  opts);
            }
          })
        });
      }
    },
    //为同key-value绑定的元素设置值, value|元素绑定的值, key|元素绑定的取值的key, values:value值所有的对象 
    //opts //value, sub, $views, isitem
    setElemValue: function(key, values, opts){
       var that = this, $i, isfullkey = key.split('.').length>1;
       var $ele = this.elem(key, opts);
       value = opts&&opts.value !== void 0 ? opts.value : (isfullkey ? utils.descendantVal(values, key) : values&&values[key]);
       $ele.each(function(i, item){
         $i = $(item);
         value = that.processEntity($i, value, key);
         that.setBindValue($i, value, values);

         if($.isArray(value)){
            that.renderList($i, value, key, values); return;
         }
       })
    },
    //设置数组值
    renderList: function($ele, value, key, values){
      var that = this;
      var storeKey = $ele[0].id ? $ele[0].id+'-'+key+'-tmpl' : key+'-tmpl'; 
      var views = this.$el.data(storeKey);
      if(!views){ this.$el.data(storeKey, $ele.html()); } //首次使用views 后存储在tmpl上
      views = this.$el.data(storeKey);

      $ele.empty();
      // that.setBindValue($ele, value, values)

      var $views, itemKey, $selem, subItemKey;
      $.each(value, function(index, vitem){
        vitem.$index = index;
        $views = $(views).clone(); 
        if(!vitem || $.isEmptyObject(vitem)){
          $views = '';
        }else{
          that.renderObject(vitem, {$views: $views, isitem: true});
        }
        $ele.append($views);
      });
    },
    //为每个单项元素设置值
    setval: function($ele, value){
      if($ele.is('input, textarea, select')) {
          $ele.val(value);

          var hasmodel = utils.hasAttr($ele, 'vb-model');
          if($ele.is('select') && $.isArray(value) && hasmodel) {
              var defaultVal = value && value.length ? value[0][$ele.attr('vb-key')] : void 0;
              utils.descendantVal(this.data, hasmodel, defaultVal);
              this.watchKey(hasmodel, defaultVal)
          }
      }else{
          $ele.html(value);
      } 
    },
    
    //设置值, 然后根据是否有其它key的类型设置不同行为
    setBindValue: function($ele, $value, $values){
      var set = utils.hasAttr($ele, 'vb-noset') === false, type, attrval, 
          types = ['entity','class','show','hide','if','value','model', 'cloak'];

      if(!$.isArray($value)){    
        if(set){
          this.setval($ele, $value)
        } else {
          $ele.attr('value', $value);
        }
      }

      for(var i=0; i<types.length; i++){
        type = types[i]
        attrval = utils.hasAttr($ele, 'vb-'+type)
        if(attrval){
          var getval = this.getBindValue($ele, attrval, $value, $values);
          if(type ==='entity' && set)
            this.setval($ele, getval?getval:$value)          
          if(type ==='value')
            $ele.attr('value', getval)          
          if(type ==='model')   //仅可以使用在表单上面
            utils.descendantVal(this.data, getval, $ele.val() || utils.descendantVal(this.data, getval));
          if(type ==='class')
            $ele.addClass(getval);
          if(type ==='if')
            if(!getval){ $ele.addClass('hidden') }else{ $ele.removeClass('hidden') }
          if(type ==='show')
            $ele.css('display', getval ? 'inherit' : 'none')
          if(type ==='hide')
            $ele.css('display', !getval ? 'none' : 'inherit')
        }
        if(type ==='cloak')
          $ele.removeAttr('vb-cloak')
      }
    },
    //获取绑定的key的计算值 $value为元素上绑定的值, $values为值所在的对象
    getBindValue: function($ele, attrval, $value, $values){
        try{
          return eval(attrval)
        }catch(e){
          return attrval
        }
    },
    //将值转化为实体输出, //实体转化可以绑定在元素上, 仅支持三目表达式
    //或使用js entity对象转换
    processEntity: function($ele, value, key){
      if(!this.entity) return value;
      var rtnVal = value; 
      $.each(this.entity, function(ekey, evalue){ //处理js entity对象转换
        if(ekey === key){
          rtnVal = evalue(value)
        }
      });
      return rtnVal;
    },
    destroyed: function(){
        this.$el.off();
        this.$el.empty();
    },
    watchKey: function(watchKey, newVal, oldval){
      if(this.watch){
        if(watchKey){
          var watchfn = this.watch[watchKey];
        }
        if(watchfn){
          watchfn = watchfn.bind(this)
          watchfn(newVal, oldval);
        }
      }
    },
    /**
     * 给组件或页面上selector指向的元素绑定事件代理，事件代理在组件根元素
     * @method ViewBind#on
     * @param {Event} eventType
     * @param {selector} selector
     * @param {eventCallback} listener - 事件监听回调
     * @returns {View}
     */
    on: function(eventType, selector, listener){
        this.$el.on(eventType, selector, listener);
    },
    /**
     * 给组件或页面上selector指向的元素取消绑定事件代理
     * @method ViewBind#off
     * @param {Event} eventType
     * @param {selector} selector
     * @param {eventCallback} listener - 事件监听回调
     * @returns {View}
     */
    off: function(eventType, selector, listener){
        this.$el.off(eventType, selector, listener);
    },
    /**
     * @private
     * @method ViewBind#_parseEvent
     * @param {object} env env为事件绑定时的listener所在的执行环境, 即events对象所在的环境，也即父对象 为ctrl或View, UI-widget
     * @param {element} delegateElement 事件代理所有的元素，默认是不需要这个参数的，其用在refreshEvent时
     * events: {
     *   'click,touch selector1,selector2': 'function',
     *   'touch .selector': function(e, target, that){}
     * }
     * 'function'有二个参数 (e, target),其this指向所在的环境即env, function直接量有三个参数，that即this
     **/
    _parseEvent: function(env){
        var events = this.events;
        if(!events) return;

        var onfn = this.on.bind(this); //修复使this指向onview里的this指向的对象
        env = env || this;
        for(var eve in events){
            (function(eve){
                var eventSrc = getEventSrc(eve),
                    eventListener = events[eve];
                onfn(eventSrc.event, eventSrc.selector, function (e){
                    if(typeof eventListener === 'function'){
                        eventListener(e, this, env);   //events对象值为函数直接量时，参列为(e, target, that)第三个参数为所在的执行环境env,即this
                        return false;
                    }
                    env[eventListener](e, this);      //events对象值为字符串时, 参列为(e, target){ //内部this指向执行环境 }
                    return false;
                });
            })(eve);
        }
        //如此的话， events触发的listener的this指向 发生动作的元素， e，对原生event对象， 第二个参数this为发生的对象，
        // eventListener里的this指向that,
        function getEventSrc(eve){
            var ret = /(\w+)+\s+(.+)/.exec(eve);
            return {
                event: ret[1],  //event type 1
                selector: ret[2]  //event selector all
            };
        }
    }
}
//change log
//20160815 create file vb-modelname vb-item 为主绑定指令(main directive)
//20160816 add vb-entity vb-class vb-noset(仅取值, 不显示值) prop, improve list render bugs
//20160817 解决设置同一绑定属性所有值的设定, list export $index
//20160818 提供基本生命周期的回调 created attached
//20160818 add new directive vb-noset 时不为节点内容设置值，但会为main directive设置值
//20160818 将模板存储在根节点上,解决相关bug
//20160819 add watch(newval, oldval) prop for watch data prop path  bug|select trigger change twice
//20160822 add vb-model for watch change, support sub key render, eg: <span vb-modelname="a.b">
//20160824 add vb-cloak
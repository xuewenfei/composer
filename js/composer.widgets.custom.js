var custom_generic_widget = $.extend({}, $.fn.composerWidgets["text"], {
	"refresh": function() {
		this.trigger("change:value");
	},
	"bind_new_row_on_enter": function(form_item, el, new_val) {
		//convenience function to ease process of adding new item to set on enter key press
		$(el).bind("keydown", function(e) {
			if( e.keyCode == 13 ) {
				$(this).blur(); //forces a 'change' event before the data is re-calculated

				//extend the set
				var val = $.extend([], form_item.value());
				val.push(new_val);
				form_item.value( val );

				form_item.get("el").find("input[type='text']:last").focus();
			}
		});
	},
	"initialize": function() {

		//initialize value, if it is not passed in
		if( !this.value() ) { this.value([""]); }
		if( !this.get("set_wrapper") ) { this.set({"set_wrapper": "<ul class='cSetWrapper'></ul>"}); }
		if( !this.get("structure_wrapper") ) { this.set({"structure_wrapper": "<li></li>"}); }

		$(this.get("el")).addClass("cTextInput");

		var html = '';
		if( this.get("label") ) {
			html += "<div class='cLabel'><label for='" + this.get("id") + "'>" + this.get("label") + "</label></div>";
		}
		html += "<div class='cInput'>";
			html += this.get("set_wrapper");
            if (!this.get("immutable")) {
                html += "<a href='#' class='cButton add'>Add</a>";
            }
		html += "</div>";
		$(this.get("el")).html(html);


        //set up sorting event helper - this is used by click and drag sorting events
        this.changeSortValue = function(originIndex, currentIndex) {
            var value = $.extend([], this.value());
            if( currentIndex < 0 ) { return false; }
            if( currentIndex > (value.length - 1) ) { return false; }

            //remove the value from the origin index
            var originValue = value.splice(originIndex, 1);

            //insert the value at the new index
            value.splice(currentIndex, 0, originValue[0]);

            this.value( value );
			return true;
        };

        //if conditions are perfect, add drag sorting
		if( this.get("sortable") && $.fn.sortable && !this.get("clickSort") ) {
            var that = this;
            $(this.get("el")).find(".cSetWrapper").sortable({
                "axis": "y",
                "handle": ".cSortHandle",
                "containment": "parent",
                "helper": 'clone',
                "start": function(evt, ui) {
                    //http://css.dzone.com/articles/keeping-track-indexes-while
                    ui.item.data("originIndex", ui.item.index());
                },
                "stop": function(evt, ui) {

                    var originIndex = ui.item.data("originIndex");
                    var currentIndex = ui.item.index();
                    that.changeSortValue(originIndex, currentIndex);
                }
            });
        }

		//bind for value change
		var item = this;
		$(this.get("el")).find("a.add").bind("click", function(e) {
			e.preventDefault();
			var val = $.extend([],item.value());
			val.push("");
			item.value( val );

			//trigger the add event
			var new_el = item.get("el").find("li:last");
			if( item.get("add") ) {
				item.get("add").apply(item, [new_el]);
			}
			item.trigger("add", new_el);
		});

		//placeholder handler
		$.fn.composerWidgets["text"].set_placeholder.apply(this);
		$.fn.composerWidgets["text"].set_tooltip.apply(this);

	},
	"set_value": function(value) {
		var val = this.value();
		var set_el = this.get("el").find(".cSetWrapper").html("");

		//we initize the elements first
		for( var index in val ) {
			var el = $( this.get("structure_wrapper") ).addClass("cSetItem");
			set_el.append(el);
		}

		//we call the 'structure' method for each initalized el
		//we do this seperately because the structure functions may modify the value,
		//which causes a recursive loop
		for( index in val ) {
			index = parseInt(index, 10);
			el = this.get("el").find(".cSetWrapper .cSetItem:eq(" + index + ")");
			

			var item = this;
			var method = {
				"id": this.get("id"),
				"index": index,
				"el": el,
				"value": function(item) {
					var el = this;
					return function(val) {
						var value = $.extend([], item.value());

						if( val !== undefined) {
							//var value = item.value();
							value[ el.index() ] = val;
							item.value( value );
							//item.value()[ el.index() ] = val;
						}

						return value[ el.index() ];
					};
				}.apply(el, [this]),
				"generateSortButton": function() {
					if( !item.get("sortable") ) {
                        return "";
                    } else if( $.fn.sortable && !item.get("clickSort") ) {
                        return "<span class='cSortHandle'>|||</span>";
                    } else {
                        return "<span class='cClickSort'><a href='#' class='cButton cClickSortUp'>&#x25b2;</a><a href='#' class='cButton cClickSortDown'>&#x25bc;</a></span>";
					}
				},
				"generateDeleteButton": function() {
					return "<a href='#' class='cButton delete'>Delete</a>";
				},
                "generateUploadButton": function() {
                    return "<a href='#' class='cButton upload'>Upload</a>";
                }
			};
			this.get("structure").apply(this, [method]);
		}			


        // Bind delete button on newly created set item
        this.get("el").find("a.delete").unbind("click").click(function(e) {
			e.preventDefault();

			var index = $(this).parents(".cSetItem").index();
			var val = $.extend([],item.value());
			var removed_value = val.splice(index, 1);

			//trigger delete event
			if( item.get("delete") ) {
				item.get("delete").apply(item, [index, removed_value[0]]);
			}
			item.trigger("delete", index, removed_value[0]);

			//update the item's value list without the removed value
			item.value( val );
		});

        this.get("el").find(".cClickSort a").bind("click", function(e) {
            e.preventDefault();
            var originIndex = $(this).parents(".cSetItem").index();
            var diff = $(this).hasClass("cClickSortDown") ? 1 : -1;
            var currentIndex = originIndex + diff;
            item.changeSortValue(originIndex, currentIndex);
        });
	}
});

$.fn.composerWidgets["set"] = custom_generic_widget;

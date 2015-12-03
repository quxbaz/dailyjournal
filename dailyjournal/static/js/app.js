// Util stuff

String.prototype.format = function() {
  var that = this;
  for (var i=0; i < arguments.length; i++) {
    var re = new RegExp('\\{'+i+'\\}', 'gi');
    that = that.replace(re, arguments[i]);
  }
  return that;
};

// Inclusive [1, 5] => 1, 2, 3, 4, 5
Handlebars.registerHelper('range', function(from, to, block) {
  var accum = '';
  var copy = _.clone(this);
  copy.iterator_n = from;
  for (var i=from; i <= to; i++) {
    accum += block.fn(copy);
    copy.iterator_n += 1;
  }
  return accum;
});

Handlebars.registerHelper('times', function(n, block) {
  var accum = '';
  var copy = _.clone(this);
  copy.iterator_n = 0;
  for (var i=0; i < n; i++) {
    accum += block.fn(copy);
    copy.iterator_n += 1;
  }
  return accum;
});

Handlebars.registerHelper('to_break_line', function(day, block) {
  if (((day + 1) % 7) == 0) {
    return block.fn(this) + '<br/>';
  } else {
    return block.fn(this);
  }
});


// Models & views

var Entry = Backbone.Model.extend({
  urlRoot: '/entry',
  defaults: {
    'date': '',
    'text': ''
  }
});

// Collection of entries for an entire year.
var Year = Backbone.Collection.extend({

  urlRoot: '/year',  // The year is specified via query string. Ex: /year?year=2015
  model: Entry,

  url: function() {
    return this.urlRoot + '?' + 'year=' + this.year;
  },

  initialize: function(year) {
    /*
      @year: Must be a string.
     */
    if (typeof year != 'string')
      throw 'Argument must be a string.'
    this.year = year;
  }

});

var YearView = Backbone.View.extend({

  className : 'year',
  template  : Handlebars.compile($('#year-template').html()),

  events: {
    'click .day'     : 'editEntry',
    'mouseout .day'  : 'clearDateLabel',
    'mouseover .day' : 'updateDateLabel'
  },

  editEntry: function(event) {
    event.preventDefault();
    $('.day', this.el).removeClass('active');
    var $day = $(event.currentTarget);
    $day.addClass('active');
    var date = $day.data('date');
    var entry = new Entry({'date': date});
    entry.fetch({data: {'date': date}}).then(function(data) {
      $('#editor').trigger('open', entry);
    });
  },

  clearDateLabel: function(event) {
    var $active_day = $('.day.active', this.el);
    if ($active_day.length) {
      var date = moment($active_day.data('date')).format('MMM D').toLowerCase();
      $('.date-label', this.el).text(date);
    } else
      $('.date-label', this.el).text('');
  },

  updateDateLabel: function(event) {
    var $el = $(event.currentTarget);
    // var date = moment($el.data('date')).format('M/D');
    var date = moment($el.data('date')).format('MMM D').toLowerCase();
    $('.date-label', this.el).text(date);
  },

  initialize: function(options) {
    this.collection = options.collection;
    this.year = this.collection.year;
  },

  render: function() {
    var days = [];
    var start = moment('{0}-{1}-{2}'.format(this.year, '01', '01'));
    var end = moment('{0}-{1}-{2}'.format(parseInt(this.year) + 1, '01', '01'));
    var i = 1;
    while (start.isBefore(end)) {
      var date = start.format('YYYY-MM-DD');
      var entry = this.collection.findWhere({'date': date}) || new Entry({'date': date});

      if (start.format('D') == '1' && i != 1) {
        days[days.length-1].is_end_of_month = true;
      }

      days.push(_.extend(entry.toJSON(), {i: i}));
      start.add(1, 'days');
      i++;
    }
    this.$el.html(this.template({year: this.year, days: days}));
    return this;
  }

});

var EditorView = Backbone.View.extend({

  el: $('#editor'),

  events: {
    'open'             : 'open',
    'click .close-btn' : 'close',
    'click .save-btn'  : 'save'
  },

  initialize: function() {
    this.entry = null;
  },

  open: function(event, entry) {
    this.$el.removeClass('active');
    _.delay(_.bind(function() {
      this.entry = entry;
      this.$el.addClass('active');
      $('textarea', this.$el).val(entry.get('text'));
    }, this), 240);
  },

  close: function(event) {
    this.$el.removeClass('active');
    this.entry = null;
  },

  save: function(event) {
    if (this.entry == null)
      this.entry = new Entry({'date': $('.day.active').data('date')});
    this.entry.save({'text': $('textarea').val()});
  }

});


// App runtime

$(document).ready(function() {

  var year = new Year('2015');
  // var onFetch = year.fetch();
  var yearView = new YearView({collection: year});
  var editorView = new EditorView();

  year.fetch().then(function(entries) {
    yearView.render().$el.appendTo('#year');
  });

  // var calendar = new Calendar();
  // window.calendar = calendar;
  // var monthView = new MonthView(calendar, 12); // 12 == December

  // calendar.year = moment().format('YYYY');
  // monthView.render().$el.appendTo('#months');

  // calendar.fetch().then(function(data) {
  //   //
  //   calendar.year = data.year;
  //   monthView.render().$el.appendTo('#months');
  // });

});

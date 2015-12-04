// Util stuff

String.prototype.format = function() {
  var that = this;
  for (var i=0; i < arguments.length; i++) {
    var re = new RegExp('\\{'+i+'\\}', 'gi');
    that = that.replace(re, arguments[i]);
  }
  return that;
};

// Calls the moment function with the preferred format.
function momentf(s) {
  return moment(s, 'YYYY-MM-DD');
}

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
  },

  comparator: function(entry) {
    return entry.get('date');
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

  initialize: function(options) {
    this.collection = options.collection;
    this.year = this.collection.year;
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
      var date = momentf($active_day.data('date')).format('MMM D').toLowerCase();
      $('.date-label', this.el).text(date);
    } else
      $('.date-label', this.el).text('');
  },

  updateDateLabel: function(event) {
    var $el = $(event.currentTarget);
    var date = momentf($el.data('date')).format('MMM D').toLowerCase();
    $('.date-label', this.el).text(date);
  },

  render: function() {
    this.$el.html(this.template({year: this.collection.toJSON()}));
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

  getText: function() {
    var $textarea = $('textarea', this.el);
    if ($textarea.is(':visible'))
      return $textarea.val().trim();
    else
      return '';
  },

  setText: function(text) {
    $('textarea', this.$el).val(text);
  },

  open: function(event, entry) {
    this.close();
    _.delay(_.bind(function() {
      this.entry = entry;
      this.$el.addClass('active');
      this.setText(entry.get('text'));
      this.enableAutosave();
    }, this), 240);
  },

  close: function(event) {
    this.save();
    this.$el.removeClass('active');
    this.entry = null;
    this.disableAutosave();
  },

  save: function(event) {
    if (this.getText() == '')
      return;
    if (this.entry == null)
      this.entry = new Entry({'date': $('.day.active').data('date')});
    this.entry.save({'text': this.getText()});
  },

  enableAutosave: function() {
    this.lastText = this.getText();
    this.autosaveId = setInterval(_.bind(function() {
      if (this.getText() != this.lastText)
        this.save();
    }, this), 3000);
  },

  disableAutosave: function() {
    this.lastText = '';
    clearInterval(this.autosaveId);
  }

});

// App util functions

// Iterates through each day of the year.
function iterYear(fn, year) {
  var start = momentf('{0}-{1}-{2}'.format(year, '01', '01'));
  var end = momentf('{0}-{1}-{2}'.format(parseInt(year) + 1, '01', '01'));
  var i = 1;
  while (start.isBefore(end)) {
    fn(start.format('YYYY-MM-DD'), i);
    start.add(1, 'days');
    i++;
  }
}

// App runtime

$(document).ready(function() {

  var currentYear = moment().format('YYYY');
  var year = new Year(currentYear);
  var yearView = new YearView({collection: year});
  var editorView = new EditorView();

  year.fetch().then(function(entries) {
    // Creating Entry models where no entries currently exist.
    iterYear(function(date, i) {
      if (!year.findWhere({'date': date}))
        year.add(new Entry({'date': date}));
    }, currentYear);
    yearView.render().$el.prependTo('.year-wrapper');
  });

});

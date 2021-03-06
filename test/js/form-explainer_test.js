var chai = require("chai");
var sinon = require("sinon");
var sinonChai = require("sinon-chai");
var expect = chai.expect;
chai.use(sinonChai);
var $;
var formExplainer;
var sticky;
var jsdom = require('mocha-jsdom');
var sandbox;


describe('Form explainer tests', function() {

  jsdom({
    file: 'test/js/fixtures/form-explainer.html',
    console: false
  });

  before(function () {
    $ = require('../../src/static/vendor/jquery/jquery.js');
    jQuery = require('../../src/static/vendor/jquery/jquery.js');
    sticky = require('../../src/static/vendor/sticky/jquery.sticky.js');
    formExplainer = require('../../src/static/js/modules/form-explainer.js');
  });

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
    formExplainer.getPageEl = function() {
      return $('#explain_page-1');
    }
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('form elements and constants exist on page', function() {
      it('has a wrapper element', function () {
        expect($('.explain')).to.have.length.above(0);
      })

      it('has tabs', function () {
        $TABS = $('.explain').find('.explain_tabs'),
        expect($TABS).to.have.length.above(0);
      })

      it('has pagination', function () {
        var $WRAPPER = $('.explain');
        $PAGINATION = $WRAPPER.find('.explain_pagination'),
        expect($PAGINATION).to.have.length.above(0);
      })

      it('has an initial tab', function () {
        var DEFAULT_TYPE = 'checklist';
        $INITIAL_TAB = $('.tab-link[data-target="' + DEFAULT_TYPE + '"]').closest('.tab-list');
        expect($INITIAL_TAB).to.have.length.above(0);
      })

      it('shows the first explainer page', function () {
        expect($('.explain_page:visible')).to.have.length.above(0);
      })
  });

  describe('initForm', function() {
    it('sets up the form pages for display', function () {
      var initPageStub = sandbox.stub(formExplainer, 'initPage');
      var $wrapper = $('.explain');
      var pageLength = $wrapper.find('.explain_page').length;
      formExplainer.initForm($wrapper);

      expect(formExplainer.initPage).to.have.callCount(pageLength);
    })
  });

  describe('initPage', function() {
    it('initialize a page, set up the image, and set categories', function () {
      var setupImageStub = sandbox.stub(formExplainer, 'setupImage');
      var setCategoryPlaceholdersStub = sandbox.stub(formExplainer, 'setCategoryPlaceholders');

      formExplainer.initPage(1);

      expect(formExplainer.setupImage).to.have.been.calledOnce;
      expect(formExplainer.setCategoryPlaceholders).to.have.been.calledOnce;
    })
  });

  describe('getPageEl', function() {
    it('should find the DOM element for the specified form page number', function() {
      var result = formExplainer.getPageEl(1);
      expect(result).to.be.ok();
      expect(result.selector).to.equal('#explain_page-1');
    });
  });

  describe('getPageElements', function() {
    it('should find and return an object containing the important elements for a given page', function() {
      var result = formExplainer.getPageElements(1);

      expect(result).to.be.ok();
      expect(result.$page.selector).to.equal('#explain_page-1');
      expect(result.$imageMap.selector).to.equal('#explain_page-1 .image-map');
      expect(result.$imageMapImage.selector).to.equal('#explain_page-1 .image-map_image');
      expect(result.$imageMapWrapper.selector).to.equal('#explain_page-1 .image-map_wrapper');
      expect(result.$terms.selector).to.equal('#explain_page-1 .terms');
    });
  });

  describe('calculateNewImageWidth', function() {
    it('calculate image width based on window height', function() {
      var result = formExplainer.calculateNewImageWidth(705, 912, 1000);
      expect(result).to.be.ok();
      expect(result).to.be.a('number');
      
    });
  });

  describe('resizeImage', function() {
    var $window, pageEls;
    
    beforeEach(function () {
      var calculateNewImageWidthStub = sandbox.stub(formExplainer, 'calculateNewImageWidth');
      pageEls = formExplainer.getPageElements(1);
      $window = $(window);
      $window.innerHeight = function () {return 100}
      
    });

    it('resizes the form image so it fits into the window', function() {
      pageEls.$imageMapImage.height = function () {return 1000;}
      formExplainer.resizeImage(pageEls, $window, true);
      expect(formExplainer.calculateNewImageWidth).to.have.been.calledOnce;
    });

    it('does not resize the form image if window has not resized', function() {
      formExplainer.resizeImage(pageEls, $window, false);
      expect(formExplainer.calculateNewImageWidth).not.to.have.been.called;
    });

  });

  describe('setImageElementWidths', function() {
    it('set the image width to match the image wrapper width due to sticky fixed positioning madness', function() {
      var imageWidth = 500;
      var pageEls = formExplainer.getPageElements(1);
      pageEls.$imageMap.width(imageWidth);
      var jQuerySpy = sandbox.spy(jQuery.prototype, 'width')
      formExplainer.setImageElementWidths(pageEls);
      expect(jQuerySpy).to.have.been.calledThrice;
      expect(pageEls.$imageMapWrapper.width()).to.equal(imageWidth);
      expect(pageEls.$imageMapImage.width()).to.equal(imageWidth);
    });
  });

  describe('storeImageDimensions', function() {
    it('stores the image width and height as jQuery data', function() {
      var jQuerySpy = sandbox.spy(jQuery.prototype, 'data')
      var pageEls = formExplainer.getPageElements(1);
      var image = $('#explain_page-1').find('.image-map_image')
      formExplainer.storeImageDimensions(image);
      expect(jQuerySpy).to.have.been.calledTwice;
    });
  });

  describe('stickImage', function() {
    it('call sticky plugin for the specified element', function() {
      var pageEls = formExplainer.getPageElements(1);
      var wrapper = pageEls.$imageMapWrapper;
      wrapper.sticky = function() {};
      var stickyStub = sandbox.stub(wrapper, 'sticky');

      formExplainer.stickImage(wrapper);
      expect(wrapper.sticky).to.have.been.calledOnce;
    });
  });

  describe('fitAndStickToWindow', function() {
    var loadSpy, attrSpy;
    beforeEach(function () {
      var storeImageDimensionsStub = sandbox.stub(formExplainer, 'storeImageDimensions');
      var resizeImageStub = sandbox.stub(formExplainer, 'resizeImage');
      var setImageElementWidthsStub = sandbox.stub(formExplainer, 'setImageElementWidths');
      attrSpy = sandbox.spy(jQuery.prototype, 'attr')
    });

    it('limits the form image to the height of the window and adjusts other elements to match', function() {
      var pageEls = formExplainer.getPageElements(1);

      formExplainer.fitAndStickToWindow(pageEls, 1);
      expect(formExplainer.storeImageDimensions).to.have.been.called;
      expect(formExplainer.resizeImage).to.have.been.called;
      expect(formExplainer.setImageElementWidths).to.have.been.called;
      expect(attrSpy).to.have.been.called;

    });

    it('run before page load and without pageNum', function() {
      var pageEls = formExplainer.getPageElements(1);

      formExplainer.fitAndStickToWindow(pageEls, null);
      expect(formExplainer.storeImageDimensions).not.to.have.been.called;
      expect(formExplainer.resizeImage).to.have.been.called;
      expect(formExplainer.setImageElementWidths).to.have.been.called;
      expect(attrSpy).to.have.been.called;

    });

  });

  describe('updateStickiness', function() {
    // @TODO: this is not done...need to check imageMapWrapper class
    it('overrides sticky plugin to avoid overlapping content', function() {
      var pageEls = formExplainer.getPageElements(1);
      pageEls.$page.offset = function () {
        return {
          top: 100,
          left: 0
        };
      }
      pageEls.$imageMapWrapper.removeClass('js-sticky-bottom');
      
      var addClassSpy = sandbox.spy(jQuery.prototype, 'addClass')
      formExplainer.updateStickiness(pageEls, 1000);
      expect(addClassSpy).to.have.been.calledOnce;
    });
    
    it('overrides sticky plugin to avoid overlapping content', function() {
      var pageEls = formExplainer.getPageElements(1);
      pageEls.$page.offset = function () {
        return {
          top: 1000,
          left: 0
        };
      }
      pageEls.$imageMapWrapper.addClass('js-sticky-bottom');
      
      var removeClassSpy = sandbox.spy(jQuery.prototype, 'removeClass')
      formExplainer.updateStickiness(pageEls, 100);
      expect(removeClassSpy).to.have.been.calledOnce;
    });
  });

});

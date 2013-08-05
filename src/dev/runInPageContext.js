var runInPageContext, wrapper;

wrapper = function () {
  // insert file here
};

runInPageContext = function (fn) {
	var script = document.createElement('script');
	script.textContent = '('+ fn +')();';
	document.body.appendChild(script);
};

runInPageContext(wrapper);

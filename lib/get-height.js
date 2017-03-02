getHeight = function(el) {
  var current = {
    display: el.style.display,
    position: el.style.position,
    top: el.style.top
  };
  el.style.display = 'block';
  el.style.position = 'absolute';
  el.style.top = '-9999px';
  var height = el.offsetHeight;
  el.style.display = current.display;
  el.style.position = current.position;
  el.style.top = current.top;
  return height;
}

module.exports = getHeight;

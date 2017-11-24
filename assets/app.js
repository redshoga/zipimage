// file -> image
function encode() {
  var data = new Uint8ClampedArray(file_reader.result);
  var data = concatTypedArrays(data, magicnumber);

  // canvasの大きさ(正方形)
  var img_size = Math.ceil(Math.sqrt((data.length/3.0) + 1));

  // canvasのcontextの取得
  var canvas = document.getElementById("canvas");
  canvas.width = img_size;
  canvas.height = img_size;
  var ctx = canvas.getContext("2d");
  var imgData = ctx.createImageData(img_size, img_size);

  // データを画素に変更
  var tmp_idx = 0;
  for (var i=0;i < data.length; i+=3) {
    imgData.data[tmp_idx++] = data[i];   //red
    imgData.data[tmp_idx++] = data[i+1]; //green
    imgData.data[tmp_idx++] = data[i+2]; //blue
    // imgData.data[i+3] = data[i+3]; //alpha // 透過を指定するとputImageDataで画素値が変わる現象がある
    imgData.data[tmp_idx++] = 255;
  }

  // 1ピクセルを透過させる(Twitterの圧縮対策)
  imgData.data[tmp_idx++] = 255;
  imgData.data[tmp_idx++] = 0
  imgData.data[tmp_idx++] = 0
  imgData.data[tmp_idx++] = 0;

  alert("変換が終了しました.表示された画像を右クリックなどでDLしてください.")
  ctx.putImageData(imgData,0,0);
}

// image -> file
function decode() {
  var img = new Image();
  img.src = img_reader.result;
  img.onload = function(){
    // contextの取得
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    // canvasの画素の取得
    var data = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // 画素値からデータを取り出す
    var file_data = [];
    for( var idx=0; idx<data.data.length; idx++ ) {
      if ((idx+1) % 4 !== 0) {
        file_data.push(data.data[idx]);
      }
    }

    // magicnumberを参照してファイルの最後を削る
    var tmp_file_str = file_data.join(".");
    var tmp_last_str = magicnumber_array.join(".");
    var tmp_last_idx = tmp_file_str.lastIndexOf(tmp_last_str)
    var tmp_pure_file_str = tmp_file_str.slice(0, tmp_last_idx);
    var last_idx = counter(tmp_pure_file_str, ".");
    file_data = file_data.slice(0, last_idx);

    // blobに変換してurlを出力
    var file_data_uint8 = new Uint8Array(file_data);
    var blob = new Blob([file_data_uint8.buffer], { type: "application/zip" });
    var url = window.URL.createObjectURL(blob);

    alert("変換が終了しました.表示されるリンクからDLしてください.")
    showDLlink(url);
  }
}

// https://qiita.com/simiraaaa/items/13b87190e9e1afc23e81
var counter = function(str, seq) {
  return str.split(seq).length - 1;
}

// https://stackoverflow.com/questions/33702838/how-to-append-bytes-multi-bytes-and-buffer-to-arraybuffer-in-javascript
function concatTypedArrays(a, b) { // a, b TypedArray of same type
  var c = new (a.constructor)(a.length + b.length);
  c.set(a, 0);
  c.set(b, a.length);
  return c;
}

function showDLlink(url) {
  document.getElementById("dllink").style.display = "block";
  document.getElementById("dllink").href = url;
}

function hideDLlink() {
  document.getElementById("dllink").style.display = "none";
}

function showCaution() {
  document.getElementById("size-caution").style.display = "block";
}

function hideCaution() {
  document.getElementById("size-caution").style.display = "none";
}

function fileChange(ev) {
  var target = ev.target;
  var file = target.files[0];
  var type = file.type;
  var size = file.size;

  hideDLlink();
  hideCaution();

  if ( document.getElementById("encode-radio").checked ) {
    if(!(type == "application/zip" || type == "application/x-zip-compressed")) {
      alert('変換できるファイルはZIPファイル(*.zip)です.');
      return;
    }

    if(size > 3000000) {
      showCaution();
    } else {
      hideCaution();
    }

    file_reader.readAsArrayBuffer(file);
    file_reader.addEventListener('load', encode, false);
  } else {
    if(type !== "image/png") {
      alert('変換できるファイルはPNGファイル(*.png)です.');
      return;
    }

    img_reader.readAsDataURL(file);
    img_reader.addEventListener('load', decode, false);
  }
}

var magicnumber_array = [0x49,0x6D,0x67,0x54,0x65,0x78,0x45,0x78,0x63,0x68];
var magicnumber = new Uint8ClampedArray(magicnumber_array)
var file_reader = new FileReader();
var img_reader = new FileReader();
var inputFile = document.getElementById('file');
inputFile.addEventListener('change', fileChange, false);

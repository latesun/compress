const fs = require("fs");
const express = require("express");
const multer = require("multer");
const sharp = require('sharp');
const async = require("async");

const app = express();

const createFolder = function(folder) {
    try {
        fs.accessSync(folder);
    } catch (e) {
        fs.mkdirSync(folder);
    }
};

let uploadFolder = "./upload/";

createFolder(uploadFolder);

let storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, uploadFolder); // 保存的路径，备注：需要自己创建
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname);
    },
});

// 通过 storage 选项来对 上传行为 进行定制化
let upload = multer({
    storage: storage
});

async function compress(imageFile, mimetype) {
    let format = sharp(imageFile).metadata().then(metadata => console.log(metadata.format))
    console.log(format)

    let inputFile = uploadFolder + imageFile
    let outputFile = uploadFolder + "compressed_" + imageFile

    await sharp(inputFile)
        .toFormat(mimetype, {
            compressionLevel: 9,
            adaptiveFiltering: true,
            force: true,
        })
        .withMetadata()
        .toFile(outputFile)
        .then(info => {
            console.log("info:", info)
        })
        .catch(
            err => {
                if (err) {
                    console.log("Compress:", err)
                }
            }
        );


    // 生成 base64
    // 检查压缩前后文件大小，取小的返回
    let minFile = getMinFile(inputFile, outputFile)
    console.log("Min file:", minFile)

    let bitmap = fs.readFileSync(minFile);
    let base64str = Buffer.from(bitmap, "binary").toString("base64");

    return base64str
}

function getMinFile(inputFile, outputFile) {
    if (fs.statSync(inputFile).size <= fs.statSync(outputFile).size) {
        return inputFile
    }
    return outputFile
}

app.get("/", (req, res) => {
    res.send("")
})

app.get("/ping", (req, res) => {
    res.send("")
})

app.get("/healthz", (req, res) => {
    res.send("")
})

app.post("/upload", upload.single("origin_picture"), async function(req, res, next) {
    let file = req.file;
    let mimetype = ""
    switch (file.mimetype) {
        case 'image/png':
            mimetype = "png"
        case 'image/jpeg':
            mimetype = "jpeg"
        case 'image/webp':
            mimetype = 'webp'
    }

    let base64str = ""
    try {
        base64str = await compress(file.originalname, mimetype)
    } catch (err) {
        if (err) {
            res.json({
                "error": err
            })
            return
        }
    }

    res.json({
        compressed_picture: "data:" + file.mimetype + ";base64," + base64str
    })
});

// 未知错误处理
function error_handler_middleware(err, req, res, next) {
    let {
        message
    } = err;
    if (err) {
        res.status(500).json({
            message: `${message || "Internal error"}`,
        });
    }
}

// 404
function not_found_middleware(req, res, next) {
    res.status(404).json({
        message: "Not found",
    });
}

app.use(not_found_middleware);
app.use(error_handler_middleware);

app.listen(3000, () => {
    console.log("Listening on 3000...")
});

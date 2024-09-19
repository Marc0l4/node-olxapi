import multer from 'multer';
import mime from 'mime-types'

//const uploadUrl = path.dirname('/public/media/');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/assets/imgs/')
    },
    filename: (req, file, cb) => {
        const type = mime.extension(file.mimetype);
        cb(null, `${new Date().getTime()}.${type}`);
    }
});

const upload = multer({ storage });

export default upload;
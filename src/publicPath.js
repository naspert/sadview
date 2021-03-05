// it is important to set global var before any imports
// this needs to be set in the calling template to be able to retrieve webpack chunks
if (process.env.NODE_ENV !== 'production') {
     console.log("dev environment -> not setting __webpack_public_path__");
} else {
    __webpack_public_path__ = window.resourceBasePath;
}


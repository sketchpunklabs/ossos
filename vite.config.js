import path     from "path";
import fs       from "fs";

const ignorePaths = [ ".git", "node_modules", "dist", "site" ];

function getHtmlPaths( dirPath = __dirname, htmlPaths = {} ){
    const files = fs.readdirSync(dirPath);

    for( const file of files ){
        if( ignorePaths.includes( file ) ) continue;

        const absPath = path.join( dirPath, file );

        if( fs.statSync(absPath).isDirectory() ){
            htmlPaths = getHtmlPaths( absPath, htmlPaths );
        
        }else if( path.extname(file) === ".html" ){
            const relPath       = path.relative( __dirname, absPath );
            htmlPaths[relPath]  = absPath;
        }
    }

    return htmlPaths;
}

export default ( { command, mode } ) => {
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    if( mode === "site" || command === "serve" ){

        const repo  = process.env.GITHUB_REPOSITORY;
        const base  = ( repo )? `/${repo.split("/")[1]}/` : '/';
        
        return {
            base,
            build       : {
                outDir          : path.resolve( __dirname, "site" ),
                minify          : false,
                rollupOptions   : { input: getHtmlPaths() },
            },
            publicDir   : path.join( __dirname, "examples", "public" ),
        };

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    } else {
        return {
            build: {
                minify          : false,

                lib             : {
                    entry   : path.resolve( __dirname, "src/ossos.ts" ),
                    name    : "ossos",
                    formats : [ "es", "cjs" ],
                },

                rollupOptions   : {
                    external    : [ "three", /^three\// ],
                }
            },
        };
    }
};
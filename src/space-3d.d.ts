type CommonRenderOptions = {
	seed?: string,
	resolution: number,
	stars?: boolean,
	pointStars?: boolean,
	nebulae?: boolean,
	nebulaColorBegin?:[number,number,number],
	nebulaColorEnd?:[number,number,number],
	sun?: boolean,
	sunColor?: [number,number,number],
	sunFalloff?: number,
	backgroundColor?: [number,number,number],
}

declare class Space3d {
	constructor(canvasOrContext?:HTMLCanvasElement|WebGLRenderingContext|WebGL2RenderingContext);

	discard():void;

	render(options:CommonRenderOptions|{
			renderToTexture?:false
	}):{
		options: CommonRenderOptions,
		textures: Record<'front'|'back'|'left'|'right'|'top'|'bottom',HTMLCanvasElement>
	};

	render(options:CommonRenderOptions|{
			renderToTexture:[WebGLFramebuffer,WebGLFramebuffer,WebGLFramebuffer,WebGLFramebuffer,WebGLFramebuffer,WebGLFramebuffer]
	}):{
		options: CommonRenderOptions,
		textures: Record<'front'|'back'|'left'|'right'|'top'|'bottom',WebGLFramebuffer>
	};

	render(options:CommonRenderOptions|{
			renderToTexture:[WebGLTexture,WebGLTexture,WebGLTexture,WebGLTexture,WebGLTexture,WebGLTexture]
	}):{
		options: CommonRenderOptions,
		textures: Record<'front'|'back'|'left'|'right'|'top'|'bottom',WebGLTexture>
	};
}

export default Space3d;

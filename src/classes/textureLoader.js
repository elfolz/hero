import { TextureLoader, SRGBColorSpace, RepeatWrapping, MeshLambertMaterial, Vector2 } from 'three'

const availableTextureTypes = ['aoMap', 'emissiveMap', 'displacementMap', 'map', 'normalMap', 'specularMap']
const process = []
const textureLoader = new TextureLoader()

export default (args) => {
	if (!args.textures) return
	args.textures.forEach(el => {
		if (!availableTextureTypes.includes(el.type)) return
		process.push(
			new Promise((resolve, reject) => {
				textureLoader.load(`./textures/${el.texture}`, texture => {
					if (!texture) throw 'invalid texture'
					texture.materialType = el.type
					texture.colorSpace = SRGBColorSpace
					texture.wrapS = RepeatWrapping
					texture.wrapT = RepeatWrapping
					if (args?.repeat) texture.repeat.set(args.repeat, args.repeat)
					resolve(texture)
				}, undefined, error => {
					reject(error)
				})
			})
		)
	})
	return new Promise((resolve, reject) => {
		Promise.all(process)
		.then(response => {
			const material = new MeshLambertMaterial()
			Object.entries(args).forEach(el => {
				if (el[0] == 'normalScale') {
					if (typeof el[1] == 'object') material[el[0]] = new Vector2(el[1][0], el[1][1])
					if (typeof el[1] == 'number') material[el[0]] = new Vector2(el[1], el[1])
				} else {
					material[el[0]] = el[1]
				}
			})
			response.forEach(el => {
				material[el.materialType] = el
			})
			resolve(material)
		})
		.catch(error => {
			reject(error)
		})
	})
}
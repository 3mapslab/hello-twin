/**
 * XHR utils contains static methods to allow easy access to services via XHR.
 *
 * @static
 * @class Service
 */
export class XHRUtils 
{
	/**
	 * Get file data from URL as text, using a XHR call.
	 * 
	 * @method readFile
	 * @param {string} fname File URL.
	 * @param {boolean} sync If set to true or undefined the file is read syncronosly.
	 * @param {Function} onLoad On load callback.
	 * @param {Function} onError On progress callback.
	 */
	static get(fname, onLoad, onError)
	{
		var file = new XMLHttpRequest();
		file.overrideMimeType("text/plain");
		file.open("GET", fname, true);

		if (onLoad !== undefined)
		{
			file.onload = function()
			{
				onLoad(file.response);
			};
		}

		if (onError !== undefined)
		{
			file.onerror = onError;
		}

		file.send(null);
	}

	/**
	 * Perform a request with the specified configuration.
	 * 
	 * Syncronous request should be avoided unless they are strictly necessary.
	 * 
	 * @method request
	 * @param {string} url Target for the request.
	 * @param {string} type Resquest type (POST, GET, ...)
	 * @param {string} header Object with data to be added to the request header.
	 * @param {string} body Data to be sent in the resquest.
	 * @param {Function} onLoad On load callback, receives data (String or Object) and XHR as arguments.
	 * @param {Function} onError XHR onError callback.
	 */
	static request(url, type, header, body, onLoad, onError)
	{
		function parseResponse(response)
		{
			try
			{
				return JSON.parse(response);
			}
			catch (e)
			{
				return response;
			}
		}

		var xhr = new XMLHttpRequest();
		xhr.overrideMimeType("text/plain");
		xhr.open(type, url, true);

		// Fill header data from Object
		if (header !== null && header !== undefined)
		{
			for (var i in header)
			{
				xhr.setRequestHeader(i, header[i]);
			}
		}

		if (onLoad !== undefined)
		{
			xhr.onload = function(event)
			{
				onLoad(parseResponse(xhr.response), xhr);
			};
		}

		if (onError !== undefined)
		{
			xhr.onerror = onError;
		}

		if (onProgress !== undefined)
		{
			xhr.onprogress = onProgress;
		}

		if (body !== undefined)
		{
			xhr.send(body);
		}
		else
		{
			xhr.send(null);
		}
	}
}

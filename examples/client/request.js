import { get, request } from '#udsp';
const response = await request('uw://127.0.0.1/index.html');
if (response) {
	console.log(response.data);
}

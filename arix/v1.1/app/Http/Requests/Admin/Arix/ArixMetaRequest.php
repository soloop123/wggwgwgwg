<?php

namespace Pterodactyl\Http\Requests\Admin\Arix;

use Pterodactyl\Http\Requests\Admin\AdminFormRequest;

class ArixMetaRequest extends AdminFormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\Rule|array|string>
     */
    public function rules(): array
    {
        return [
            'arix:meta_color' => 'required|string',
            'arix:meta_title' => 'required|string',
            'arix:meta_description' => 'required|string',
            'arix:meta_image' => 'required|string',
            'arix:meta_favicon' => 'required|string',
        ];
    }
}
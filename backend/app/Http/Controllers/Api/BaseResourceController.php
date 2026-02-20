<?php

namespace App\Http\Controllers\Api;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;

abstract class BaseResourceController extends ResourceController
{
    abstract protected function model(): string;

    abstract protected function storeRules(Request $request): array;

    abstract protected function updateRules(Request $request, int $id): array;

    protected function orderBy(): string
    {
        return 'name';
    }

    protected function transformForStore(array $validated): array
    {
        return $validated;
    }

    protected function transformForUpdate(array $validated, int $id): array
    {
        return $validated;
    }

    public function index()
    {
        $model = $this->model();

        $rows = $model::query()
            ->orderBy($this->orderBy())
            ->get();

        return $this->success($rows);
    }

    public function store(Request $request)
    {
        $model = $this->model();

        $validated = $request->validate($this->storeRules($request));
        $payload = $this->transformForStore($validated);

        /** @var Model $row */
        $row = $model::create($payload);

        return $this->created($row);
    }

    public function update(Request $request, int $id)
    {
        $model = $this->model();

        /** @var Model $row */
        $row = $model::query()->findOrFail($id);

        $validated = $request->validate($this->updateRules($request, $id));
        $payload = $this->transformForUpdate($validated, $id);

        $row->update($payload);

        return $this->success($row);
    }

    public function destroy(int $id)
    {
        $model = $this->model();

        /** @var Model $row */
        $row = $model::query()->findOrFail($id);

        try {
            $row->delete();
            return $this->success(null, 'Deleted');
        } catch (QueryException $e) {
            return $this->error('Tidak bisa dihapus karena masih digunakan oleh data lain.', 409);
        }
    }
}

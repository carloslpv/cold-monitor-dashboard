import { useCallback, useEffect, useState } from 'react'
import { fetchAllEquipment, updateEquipment } from '../lib/api'
import { withActive } from '../lib/equipmentForm'
import { formatRange, TYPE_LABEL } from '../lib/format'
import type { Equipment } from '../lib/types'
import { Dialog } from './Dialog'
import { EquipmentForm } from './EquipmentForm'

type Editing = { mode: 'new' } | { mode: 'edit'; equipment: Equipment }

interface Props {
  /** Changes when the live stream reports an equipment change, so edits made elsewhere show up here. */
  version: number
  /** The user may only look: no registering, editing, deactivating or reactivating. */
  readOnly: boolean
}

function byActiveThenName(a: Equipment, b: Equipment): number {
  if (a.active !== b.active) return a.active ? -1 : 1
  return a.name.localeCompare(b.name, 'pt-BR')
}

/** Lists all equipment and lets the user register, edit, deactivate and reactivate it. */
export function EquipmentManager({ version, readOnly }: Props) {
  const [equipment, setEquipment] = useState<Equipment[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Editing | null>(null)
  const [deactivating, setDeactivating] = useState<Equipment | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetchAllEquipment(controller.signal)
      .then((list) => {
        setEquipment(list)
        setError(null)
      })
      .catch((e: unknown) => {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : String(e))
      })
    return () => controller.abort()
  }, [version])

  const replace = useCallback((saved: Equipment) => {
    setEquipment((previous) => {
      const others = (previous ?? []).filter((e) => e.id !== saved.id)
      return [...others, saved]
    })
  }, [])

  async function setActive(target: Equipment, active: boolean) {
    setBusyId(target.id)
    setNotice(null)
    try {
      replace(await updateEquipment(target.id, withActive(target, active)))
      setNotice(`Equipamento ${active ? 'reativado' : 'desativado'}: ${target.name}.`)
    } catch (e) {
      setError(`Não foi possível ${active ? 'reativar' : 'desativar'} ${target.name}: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusyId(null)
      setDeactivating(null)
    }
  }

  const sorted = equipment ? [...equipment].sort(byActiveThenName) : []
  const activeCount = sorted.filter((e) => e.active).length

  return (
    <main className="manager">
      <div className="manager-header">
        <div>
          <h2>Equipamentos</h2>
          {equipment && (
            <p className="muted">
              {activeCount} ativo{activeCount === 1 ? '' : 's'} · {sorted.length - activeCount} inativo
              {sorted.length - activeCount === 1 ? '' : 's'}
            </p>
          )}
        </div>
        {!readOnly && (
          <button type="button" className="button button-primary" onClick={() => setEditing({ mode: 'new' })}>
            Novo equipamento
          </button>
        )}
      </div>
      {readOnly && (
        <p className="muted">Acesso somente para consulta: cadastro e alterações ficam com o administrador.</p>
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <p className="notice" role="status">
        {notice}
      </p>

      {equipment === null && !error && <p className="muted">Carregando…</p>}
      {equipment !== null && sorted.length === 0 && (
        <p className="muted empty">
          Nenhum equipamento cadastrado.{!readOnly && ' Use “Novo equipamento” para começar.'}
        </p>
      )}

      {sorted.length > 0 && (
        <div className="table-scroll table-manager">
          <table>
            <thead>
              <tr>
                <th scope="col">Equipamento</th>
                <th scope="col">Local</th>
                <th scope="col">Tipo</th>
                <th scope="col">Faixa permitida</th>
                <th scope="col">Situação</th>
                {!readOnly && (
                  <th scope="col">
                    <span className="visually-hidden">Ações</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {sorted.map((e) => (
                <tr key={e.id} className={e.active ? undefined : 'row-inactive'}>
                  <td>
                    {e.name}
                    <span className="muted code"> {e.code}</span>
                  </td>
                  <td>{e.location ?? '—'}</td>
                  <td>{TYPE_LABEL[e.type]}</td>
                  <td className="numeric-cell">{formatRange(e.minTemperature, e.maxTemperature)}</td>
                  <td>
                    <span className={`badge ${e.active ? 'badge-good' : 'badge-neutral'}`}>
                      <span className="badge-icon" aria-hidden="true">
                        {e.active ? '●' : '○'}
                      </span>
                      {e.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  {!readOnly && (
                    <td className="row-actions">
                      <button
                        type="button"
                        className="button button-small"
                        onClick={() => setEditing({ mode: 'edit', equipment: e })}
                        aria-label={`Editar ${e.name}`}
                      >
                        Editar
                      </button>
                      {e.active ? (
                        <button
                          type="button"
                          className="button button-small button-danger"
                          disabled={busyId === e.id}
                          onClick={() => setDeactivating(e)}
                          aria-label={`Desativar ${e.name}`}
                        >
                          Desativar
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="button button-small"
                          disabled={busyId === e.id}
                          onClick={() => setActive(e, true)}
                          aria-label={`Reativar ${e.name}`}
                        >
                          {busyId === e.id ? 'Reativando…' : 'Reativar'}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <EquipmentForm
          equipment={editing.mode === 'edit' ? editing.equipment : undefined}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            replace(saved)
            setEditing(null)
            setError(null)
            setNotice(`Equipamento ${editing.mode === 'edit' ? 'atualizado' : 'cadastrado'}: ${saved.name}.`)
          }}
        />
      )}

      {deactivating && (
        <Dialog title={`Desativar ${deactivating.name}?`} onClose={() => setDeactivating(null)}>
          <p>
            O equipamento sai do monitoramento, deixa de aceitar leituras e não gera mais alertas. O histórico é
            mantido, e você pode reativá-lo depois.
          </p>
          <div className="form-actions">
            <button type="button" className="button" onClick={() => setDeactivating(null)}>
              Cancelar
            </button>
            <button
              type="button"
              className="button button-danger-solid"
              disabled={busyId === deactivating.id}
              onClick={() => setActive(deactivating, false)}
            >
              {busyId === deactivating.id ? 'Desativando…' : 'Desativar'}
            </button>
          </div>
        </Dialog>
      )}
    </main>
  )
}

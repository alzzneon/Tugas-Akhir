import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import DataTable from "../../Components/Admin/DataTable";
import Modal from "../../Components/Admin/Modal";
import FormFields from "../../Components/Admin/FormFields";
import ConfirmModal from "../../Components/Admin/ConfirmModal";

import { adminFetch } from "../../lib/adminFetch";

export default function AdminUsers() {
  const nav = useNavigate();

  const endpoint = "/api/admin/admins";

  const columns = [
    { key: "full_name", label: "Nama" },
    { key: "email", label: "Email" },
    { key: "phone_number", label: "No HP" },
  ];

  const [rows,setRows] = useState([]);
  const [loading,setLoading] = useState(true);
  const [msg,setMsg] = useState("");

  const [open,setOpen] = useState(false);
  const [mode,setMode] = useState("create");
  const [active,setActive] = useState(null);

  const [form,setForm] = useState({
    full_name:"",
    email:"",
    password:"",
    phone_number:"",
    address:""
  });

  const loadData = async () => {
    try{
      setLoading(true);

      const data = await adminFetch(endpoint);

      setRows(Array.isArray(data)?data:[]);

    }catch(e){

      if(e.message==="UNAUTHORIZED"){
        nav("/admin/login",{replace:true});
        return;
      }

      setMsg("Gagal memuat data");

    }finally{
      setLoading(false);
    }
  };

  useEffect(()=>{
    loadData();
  },[]);

  const openCreate = ()=>{
    setMode("create");
    setForm({
      full_name:"",
      email:"",
      password:"",
      phone_number:"",
      address:""
    });
    setOpen(true);
  };

  const openEdit = (row)=>{
    setMode("edit");
    setActive(row);
    setForm({
      full_name:row.full_name,
      email:row.email,
      password:"",
      phone_number:row.phone_number,
      address:row.address
    });
    setOpen(true);
  };

  const submit = async(e)=>{
    e.preventDefault();

    try{

      if(mode==="create"){

        await adminFetch(endpoint,{
          method:"POST",
          body:JSON.stringify(form),
          headers:{ "Content-Type":"application/json" }
        });

      }else{

        await adminFetch(`${endpoint}/${active.id}`,{
          method:"PUT",
          body:JSON.stringify(form),
          headers:{ "Content-Type":"application/json" }
        });

      }

      setOpen(false);
      loadData();

    }catch(err){
      setMsg(err.message || "Gagal menyimpan");
    }
  };

  const remove = async(row)=>{
    if(!confirm("Hapus admin ini?")) return;

    try{

      await adminFetch(`${endpoint}/${row.id}`,{
        method:"DELETE"
      });

      loadData();

    }catch(err){
      setMsg(err.message);
    }
  };

  const fields = [
    { key:"full_name", label:"Nama", required:true },
    { key:"email", label:"Email", required:true },
    { key:"password", label:"Password", type:"password" },
    { key:"phone_number", label:"No HP" },
    { key:"address", label:"Alamat" }
  ];

  return (
    <div>

      {msg && (
        <div className="mb-4 text-red-600 text-sm">
          {msg}
        </div>
      )}

      <DataTable
        title="Admin"
        columns={columns}
        rows={rows}
        loading={loading}
        onCreate={openCreate}
        onEdit={openEdit}
        onDelete={remove}
      />

      <Modal
        open={open}
        title={mode==="create" ? "Tambah Admin" : "Edit Admin"}
        onClose={()=>setOpen(false)}
      >

        <form onSubmit={submit}>
          <FormFields fields={fields} form={form} setForm={setForm} />

          <div className="flex justify-end gap-2 mt-4">

            <button
              type="button"
              onClick={()=>setOpen(false)}
              className="border px-4 py-2 rounded-xl"
            >
              Batal
            </button>

            <button
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl"
            >
              Simpan
            </button>

          </div>
        </form>

      </Modal>

    </div>
  );
}             